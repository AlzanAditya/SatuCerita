// Konfigurasi undangan: ubah data acara, endpoint RSVP, dan teks di sini.

const INVITATION = {
  eventTitle: "Pernikahan John & Jane",
  eventStart: "2027-09-18T08:00:00+07:00",
  eventEnd: "2027-09-18T14:00:00+07:00",
  eventLocation: "Masjid Nurul Huda, Jl. Kaliurang Km. 7, Sleman, Yogyakarta",
  calendarEventLabel: "18 September 2027, hari pernikahan",
  // Kosongkan endpoint untuk mode lokal: ucapan hanya tampil di layar dan tidak disimpan.
  rsvpEndpoint: "",
  wishesEndpoint: "",
  maxGuests: 2,
  // Opsional: nama tamu juga bisa dikirim lewat URL, mis. ?to=Budi
  guestCode: "",
  guestName: ""
};

const I18N = {
  weekdaysShort: "Min,Sen,Sel,Rab,Kam,Jum,Sab",
  calendarDetails: "Kehadiran dan doa restu Anda adalah kebahagiaan bagi kami.",
  viewPhoto: "Lihat foto",
  menuOpen: "Buka menu",
  menuClose: "Tutup menu",
  badgeYes: "Hadir",
  badgeNo: "Berhalangan",
  badgeMaybe: "Masih ragu",
  wishesEmpty: "Belum ada pesan. Tuliskan doa pertama untuk kami.",
  rsvpRequired: "Mohon isi nama dan pesan Anda terlebih dahulu.",
  rsvpThanks: "Matur nuwun, pesan dan doa Anda sudah kami terima.",
  rsvpFailed: "Pesan gagal terkirim, silakan coba lagi.",
  rsvpInvalid: "Mohon periksa kembali isian Anda.",
  rsvpRateLimited: "Terlalu sering mengirim, tunggu sebentar lalu coba lagi.",
  previewNotice: "Mode pratinjau: pesan hanya tampil di perangkat ini dan tidak tersimpan.",
  sending: "Mengirim…",
  giftOpen: "Lihat Rekening",
  giftHide: "Sembunyikan",
  copied: "Tersalin",
  copyFailed: "Gagal menyalin"
};

const SAMPLE_WISHES = [];

const WEEKDAY_SHORT = I18N.weekdaysShort.split(",");
const ATTENDANCE_BADGES = { yes: I18N.badgeYes, no: I18N.badgeNo, maybe: I18N.badgeMaybe };

// Musik latar. Isi "videoId" (ID video YouTube) ATAU "audio" (path/URL file mp3/m4a, mis. "assets/music/lagu.mp3").
// Kosongkan keduanya untuk menonaktifkan pemutar. Musik mulai saat tombol pembuka undangan ditekan.
const MUSIC = {
  videoId: "e1mOmdykmwI",
  audio: "",
  start: 2,
  end: 0,
  autoplay: true,
  preview: false,
  labels: {
    "error": "Lagu YouTube gagal diputar (kode {code}). {reason}",
    "errorAudio": "File musik gagal diputar. Unggah ulang dalam format MP3 atau M4A.",
    "errorEmbed": "Pemilik video tidak mengizinkan video ini diputar di situs lain. Ganti dengan video resmi/lain.",
    "errorMissing": "Video tidak ditemukan, privat, atau dihapus.",
    "errorOther": "Coba video lain.",
    "pause": "Matikan musik",
    "play": "Putar musik"
  }
};
