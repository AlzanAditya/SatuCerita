import { test } from "node:test";
import assert from "node:assert/strict";
import { createOrderWatcher, type EventSourceLike, type OrderStreamEvent } from "../../src/lib/orderStream";
class FakeES implements EventSourceLike {
  static all: FakeES[] = []; readyState = 1; onerror: ((e: unknown) => void) | null = null; closed = false;
  private l: Record<string, ((e: {data?: string}) => void)[]> = {};
  constructor(public url: string) { FakeES.all.push(this); }
  addEventListener(t: string, cb: (e: {data?: string}) => void) { (this.l[t] ||= []).push(cb); }
  close() { this.closed = true; this.readyState = 2; }
  emit(ev: Partial<OrderStreamEvent>) { for (const cb of this.l.status ?? []) cb({data: JSON.stringify({invoiceNo:"SC1",paidAt:null,paymentReady:true,updatedAt:"",...ev})}); }
  /** error sementara: browser CONNECTING, akan reconnect sendiri (readyState tetap bukan CLOSED). */
  failTransient() { this.readyState = 0; this.onerror?.({}); }
  /** error permanen: respons non-200 -> browser CLOSED, TIDAK reconnect sendiri. */
  failPermanent() { this.readyState = 2; this.onerror?.({}); }
}
function setup() {
  FakeES.all=[]; let fetches=0; const events: OrderStreamEvent[]=[];
  const w=createOrderWatcher({createEventSource:(u)=>new FakeES(u),fetchOrder:async()=>{fetches++;}}, {url:"/api/orders/SC1/events",onEvent:e=>events.push(e)});
  return {w,events,getFetches:()=>fetches};
}
test("event paid diterima tanpa refresh dan stream berhenti",()=>{const {w,events}=setup();w.start();FakeES.all[0].emit({status:"paid"});assert.deepEqual(events.map(x=>x.status),["paid"]);assert.equal(w.mode,"stopped");assert.equal(FakeES.all[0].closed,true);});
test("semua status final menghentikan stream",()=>{for(const status of ["expired","cancelled","failed","needs_review"]){const {w,events}=setup();w.start();FakeES.all[0].emit({status});FakeES.all[0].emit({status:"pending"});assert.equal(events.length,1);assert.equal(w.mode,"stopped");}});
test("error SSE sementara: satu refetch DB (bukan polling); EventSource menangani reconnect sendiri",()=>{const {w,getFetches}=setup();w.start();FakeES.all[0].failTransient();assert.equal(w.mode,"sse");assert.equal(getFetches(),1); // sekali per kegagalan
  FakeES.all[0].failTransient(); assert.equal(getFetches(),1); // beruntun < 10 detik: tidak nambah
});
test("error SSE permanen (CLOSED): dibuka ulang dengan backoff dan snapshot terbaru didapat",async()=>{
  FakeES.all=[]; let fetches=0; const events: OrderStreamEvent[]=[];
  const w=createOrderWatcher({createEventSource:(u)=>new FakeES(u),fetchOrder:async()=>{fetches++;}},
    {url:"/api/orders/SC1/events",onEvent:e=>events.push(e),restartDelayMs:1});
  w.start(); assert.equal(FakeES.all.length,1);
  FakeES.all[0].failPermanent(); assert.equal(w.mode,"idle"); // koneksi mati -> menunggu backoff
  await new Promise(r=>setTimeout(r,5)); // backoff 1ms -> buka ulang
  assert.equal(FakeES.all.length,2,"koneksi dibuka ulang otomatis");
  assert.equal(FakeES.all[0].closed,true);
  FakeES.all[1].emit({status:"paid"}); // snapshot dari koneksi baru
  assert.deepEqual(events.map(x=>x.status),["paid"]);
  assert.equal(w.mode,"stopped");
});
test("backoff bertumbuh dan event status meresetnya",async()=>{
  FakeES.all=[]; const events: OrderStreamEvent[]=[];
  const w=createOrderWatcher({createEventSource:(u)=>new FakeES(u),fetchOrder:async()=>{}},
    {url:"/api/orders/SC1/events",onEvent:e=>events.push(e),restartDelayMs:1});
  w.start();
  FakeES.all[0].failPermanent(); await new Promise(r=>setTimeout(r,5)); // restart 1
  FakeES.all[1].failPermanent(); FakeES.all[1].failPermanent(); await new Promise(r=>setTimeout(r,5)); // restart 2
  assert.equal(FakeES.all.length,3);
  FakeES.all[2].emit({status:"pending"}); // stream hidup -> reset
  FakeES.all[2].failPermanent(); await new Promise(r=>setTimeout(r,5));
  assert.equal(FakeES.all.length,4); // masih bisa restart setelah reset
  w.stop();
});
test("satu koneksi dan stop saat unmount",()=>{const {w}=setup();w.start();w.start();assert.equal(FakeES.all.length,1);w.stop();assert.equal(FakeES.all[0].closed,true);assert.equal(w.mode,"stopped");});
test("stop membatalkan restart yang dijadwalkan",async()=>{
  FakeES.all=[]; const events: OrderStreamEvent[]=[];
  const w=createOrderWatcher({createEventSource:(u)=>new FakeES(u),fetchOrder:async()=>{}},
    {url:"/api/orders/SC1/events",onEvent:e=>events.push(e),restartDelayMs:1});
  w.start(); FakeES.all[0].failPermanent(); w.stop();
  await new Promise(r=>setTimeout(r,5));
  assert.equal(FakeES.all.length,1,"tidak ada koneksi baru setelah stop");
  assert.equal(w.mode,"stopped");
});
test("pause menutup koneksi dan resume membaca snapshot sekali lalu subscribe lagi",()=>{const {w,getFetches}=setup();w.start();w.pause();assert.equal(FakeES.all[0].closed,true);w.resume();assert.equal(getFetches(),1);assert.equal(FakeES.all.length,2);});
