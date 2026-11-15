/**
 * Kamus teks BERSAMA (dipakai landing, studio, dan dash): switcher bahasa,
 * kartu login, dan pesan error API. Bahasa Indonesia = sumber kebenaran;
 * `common.en.ts` WAJIB punya key yang sama (dicek TypeScript).
 */
export const commonId = {
  // Umum
  "common.cancel": "Batal",
  "common.save": "Simpan",
  "common.back": "Kembali",
  "common.loading": "Memuat",
  "common.close": "Tutup",
  "common.retry": "Coba lagi",
  "auth.denied": "Akses ditolak",
  "auth.signOut": "Keluar",
  "auth.noAdminAccess": "Akun ini tidak memiliki akses ke dashboard admin.",

  // Language switcher
  "lang.choose": "Pilih Bahasa",

  // LoginCard
  "auth.adminTitle": "Login Admin",
  "auth.signUpTitle": "Daftar Akun",
  "auth.login": "Login",
  "auth.haveAccount": "Sudah Punya Akun? ",
  "auth.noAccount": "Belum Punya Akun? ",
  "auth.register": "Daftar",
  "auth.adminSubtitle": "Masuk ke Dashboard Admin Satu Cerita",
  "auth.google": "Masuk dengan Google",
  "auth.or": "Atau",
  "auth.namePh": "Nama lengkap",
  "auth.emailPh": "Masukkan alamat email",
  "auth.passwordPh": "Kata sandi",
  "auth.confirmPh": "Ulangi kata sandi",
  "auth.showPw": "Tampilkan kata sandi",
  "auth.hidePw": "Sembunyikan kata sandi",
  "auth.forgot": "Lupa kata sandi?",
  "auth.forgotInfo":
    "Reset kata sandi segera tersedia. Untuk sementara, masuk dengan Google atau hubungi admin.",
  "auth.processing": "Memproses...",
  "auth.agree": "Dengan masuk, Anda menyetujui",
  "auth.terms": "Syarat & Kebijakan Privasi",
  "auth.err.email": "Masukkan alamat email yang valid.",
  "auth.err.nameMin": "Nama lengkap minimal 2 karakter.",
  "auth.err.pwMin": "Kata sandi minimal 8 karakter.",
  "auth.err.pwMismatch": "Konfirmasi kata sandi tidak sama.",
  "auth.err.pwRequired": "Kata sandi wajib diisi.",

  // Pesan error dari API/Worker diterjemahkan lewat peta frasa (phrases.ts)
  "api.err.generic": "Terjadi kesalahan. Coba lagi.",
} as const;
