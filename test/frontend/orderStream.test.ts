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
  fail() { this.onerror?.({}); }
}
function setup() {
  FakeES.all=[]; let fetches=0; const events: OrderStreamEvent[]=[];
  const w=createOrderWatcher({createEventSource:(u)=>new FakeES(u),fetchOrder:async()=>{fetches++;}}, {url:"/api/orders/SC1/events",onEvent:e=>events.push(e)});
  return {w,events,getFetches:()=>fetches};
}
test("event paid diterima tanpa refresh dan stream berhenti",()=>{const {w,events}=setup();w.start();FakeES.all[0].emit({status:"paid"});assert.deepEqual(events.map(x=>x.status),["paid"]);assert.equal(w.mode,"stopped");assert.equal(FakeES.all[0].closed,true);});
test("semua status final menghentikan stream",()=>{for(const status of ["expired","cancelled","failed","needs_review"]){const {w,events}=setup();w.start();FakeES.all[0].emit({status});FakeES.all[0].emit({status:"pending"});assert.equal(events.length,1);assert.equal(w.mode,"stopped");}});
test("tidak ada polling ketika SSE error; EventSource menangani reconnect",()=>{const {w,getFetches}=setup();w.start();FakeES.all[0].fail();assert.equal(w.mode,"sse");assert.equal(getFetches(),0);});
test("satu koneksi dan stop saat unmount",()=>{const {w}=setup();w.start();w.start();assert.equal(FakeES.all.length,1);w.stop();assert.equal(FakeES.all[0].closed,true);assert.equal(w.mode,"stopped");});
test("pause menutup koneksi dan resume membaca snapshot sekali lalu subscribe lagi",()=>{const {w,getFetches}=setup();w.start();w.pause();assert.equal(FakeES.all[0].closed,true);w.resume();assert.equal(getFetches(),1);assert.equal(FakeES.all.length,2);});
