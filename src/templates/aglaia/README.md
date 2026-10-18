# Aglaia – Undangan Pernikahan Digital

Website statis (tanpa build step): HTML + CSS + JavaScript biasa. Animasi memakai GSAP + ScrollTrigger, scroll halus memakai Lenis (file sudah ada di `vendor/`, jadi bisa jalan offline).

## Menjalankan

```bash
npm start          # atau: python3 -m http.server 3000
```

Buka http://localhost:3000. Gunakan server lokal, bukan membuka `index.html` langsung dengan `file://`, supaya font dan aset termuat dengan benar.

## Struktur

```
index.html        Markup semua bagian undangan
css/              Gaya per komponen (urutan load ada di index.html)
  fonts, base     @font-face, variabel warna/tipografi, tombol, section
  cover, hero     Sampul amplop dan hero
  scene, story    Latar, letter, mempelai, perjalanan
  countdown, details, gallery, quote, rsvp, closing
  navigation      Tombol & menu
  guest-qr, layout, animations
js/               Skrip per fitur (classic script, urutan load ada di index.html)
  config.js       DATA ACARA, endpoint RSVP, dan teks — edit di sini
  utils, scroll   Helper, lalu setup Lenis/ScrollTrigger
  cover … closing Animasi tiap bagian
  media.js        Video latar lokal (opsional)
  music-player.js Pemutar musik latar (pengaturan lagu: MUSIC di config.js)
  rsvp, gift      Form ucapan/RSVP dan amplop hadiah
  main.js         Inisialisasi
assets/           Gambar (webp) dan font (woff2)
vendor/           gsap, ScrollTrigger, lenis
```

## Kustomisasi cepat

- Nama, tanggal, lokasi: ubah teks di `index.html` dan `js/config.js` (`INVITATION`).
- Nama tamu: tambahkan `?to=Nama` di URL.
- Musik: ubah `MUSIC.videoId` (ID video YouTube) atau isi `MUSIC.audio` dengan file mp3/m4a lokal; kosongkan keduanya untuk mematikan pemutar. Lagu YouTube butuh koneksi internet.
- RSVP/ucapan: isi `rsvpEndpoint` dan `wishesEndpoint` di `js/config.js`. Jika kosong, ucapan hanya tampil di layar dan tidak disimpan.
