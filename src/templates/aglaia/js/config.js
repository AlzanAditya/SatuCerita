// Konfigurasi undangan: ubah data acara, endpoint RSVP, dan teks di sini.

const INVITATION = {
  eventTitle: "Pernikahan John & Jane",
  eventStart: "2026-12-20T08:00:00+07:00",
  eventEnd: "2026-12-20T14:00:00+07:00",
  eventLocation: "Masjid Baiturrahman, Jl. Telaga Biru No. 21, Bogor",
  calendarEventLabel: "20 Desember 2026, hari pernikahan",
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
  calendarDetails: "Kami menanti kehadiran Anda di dermaga bahagia kami.",
  viewPhoto: "Lihat foto",
  menuOpen: "Buka menu",
  menuClose: "Tutup menu",
  badgeYes: "Akan hadir",
  badgeNo: "Berhalangan",
  badgeMaybe: "Belum pasti",
  wishesEmpty: "Botol pesan masih kosong. Titipkan doa pertama Anda.",
  rsvpRequired: "Mohon lengkapi nama dan ucapan Anda terlebih dahulu.",
  rsvpThanks: "Terima kasih, pesan Anda telah sampai.",
  rsvpFailed: "Pesan belum terkirim, silakan coba sekali lagi.",
  rsvpInvalid: "Mohon periksa kembali isian Anda.",
  rsvpRateLimited: "Terlalu banyak percobaan, silakan coba beberapa saat lagi.",
  previewNotice: "Mode pratinjau: pesan hanya tampil di layar ini dan tidak disimpan.",
  sending: "Mengirim pesan…",
  giftOpen: "Buka Amplop",
  giftHide: "Tutup Amplop",
  copied: "Tersalin",
  copyFailed: "Gagal menyalin"
};


const SAMPLE_WISHES = [];

const WEEKDAY_SHORT = I18N.weekdaysShort.split(",");
const ATTENDANCE_BADGES = { yes: I18N.badgeYes, no: I18N.badgeNo, maybe: I18N.badgeMaybe };

// Musik latar. Isi "videoId" (ID video YouTube) ATAU "audio" (path/URL file mp3/m4a, mis. "assets/music/lagu.mp3").
// Kosongkan keduanya untuk menonaktifkan pemutar. Musik mulai saat tombol pembuka undangan ditekan.
const MUSIC = {
  videoId: "NZGHXy1IAHM",
  audio: "",
  start: 0,
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
