/**
 * Kamus teks BERSAMA (dipakai landing, studio, dan dash): switcher bahasa,
 * kartu login, dan pesan error API. Bahasa Indonesia = sumber kebenaran;
 * `common.en.ts` WAJIB punya key yang sama (dicek TypeScript).
 */
export const commonId = {
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

  // Pesan error dari API/Worker (dipetakan lewat translateApiError)
  "api.err.connect": "Tidak dapat terhubung ke server.",
  "api.err.invalidCreds": "Email atau kata sandi tidak valid.",
  "api.err.googleOnly": "Akun ini hanya bisa masuk lewat Google.",
  "api.err.unconfirmed": "Email belum dikonfirmasi. Cek kotak masuk Anda.",
  "api.err.wrongCreds": "Email atau kata sandi salah.",
  "api.err.emailFormat": "Format email tidak valid.",
  "api.err.pwMin": "Kata sandi minimal 8 karakter.",
  "api.err.nameMin": "Nama lengkap minimal 2 karakter.",
  "api.err.emailBlocked": "Email ini tidak dapat didaftarkan.",
  "api.err.weakPw": "Kata sandi terlalu lemah.",
  "api.err.signupFailed": "Pendaftaran gagal. Periksa data Anda lalu coba lagi.",
  "api.err.generic": "Terjadi kesalahan. Coba lagi.",
} as const;
