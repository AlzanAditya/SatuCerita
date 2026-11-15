import type { Language } from "@/context/LanguageContext";

/**
 * Peta frasa "teks Indonesia -> Inggris" untuk teks yang DATANG DARI LUAR komponen:
 *  - label form editor (dari shared/templates/helpers.ts, dipakai juga oleh Worker)
 *  - instruksi & grup metode pembayaran
 *  - pesan error dari Worker (selalu Indonesia)
 * Dipakai lewat `useT().tr(teks)`. Teks yang tidak ada di peta dikembalikan apa adanya,
 * jadi menambah label baru di shared/ tidak akan merusak apa pun (hanya belum diterjemahkan).
 */
const EN: Record<string, string> = {
  // ---------- Form editor: judul bagian ----------
  "Mempelai Pria": "Groom",
  "Mempelai Wanita": "Bride",
  "Ucapan Pembuka": "Opening Words",
  "Cerita Cinta": "Love Story",
  Kutipan: "Quote",
  "Dress Code": "Dress Code",
  "Siaran Langsung": "Live Stream",
  "Amplop Digital": "Digital Envelope",
  Penutup: "Closing",
  "RSVP & Ucapan": "RSVP & Wishes",
  "Musik Latar": "Background Music",
  "Judul & Pratinjau Link": "Link Title & Preview",

  // ---------- Form editor: label & bantuan ----------
  "Keterangan anak ke-": "Child order label",
  "Putra kedua dari": "Second son of",
  "Putri pertama dari": "First daughter of",
  "Nama ayah (tanpa “Bapak”)": "Father's name (without “Mr.”)",
  "Nama ibu (tanpa “Ibu”)": "Mother's name (without “Mrs.”)",
  "Instagram (opsional)": "Instagram (optional)",
  "username atau link": "username or link",
  "Tanggal acara pertama dipakai untuk hitung mundur dan kalender.":
    "The first event's date is used for the countdown and calendar.",
  "Nama acara": "Event name",
  "Judul kecil": "Small heading",
  Tanggal: "Date",
  Mulai: "Start",
  Selesai: "End",
  "Zona waktu": "Time zone",
  "Nama tempat": "Venue name",
  "Alamat lengkap": "Full address",
  "Link Google Maps (opsional)": "Google Maps link (optional)",
  "Kosongkan agar dibuat otomatis dari nama tempat dan alamat.":
    "Leave blank to generate it automatically from the venue name and address.",
  "Keterangan singkat": "Short description",
  "Sebutan tamu di sampul": "Guest label on the cover",
  "Tampil bila tamu membuka link tanpa nama.": "Shown when a guest opens the link without a name.",
  "Kalimat sambutan di halaman utama": "Welcome line on the main page",
  "Salam pembuka": "Opening greeting",
  "Ayat / kutipan pembuka": "Opening verse / quote",
  "Sumber kutipan": "Quote source",
  "Paragraf undangan": "Invitation paragraph",
  "Penulis kutipan": "Quote author",
  "Catatan busana": "Attire note",
  "Kosongkan untuk menyembunyikan.": "Leave blank to hide.",
  Platform: "Platform",
  "Judul siaran": "Stream title",
  "Link siaran": "Stream link",
  "Penerima kado fisik": "Recipient of physical gifts",
  "Alamat pengiriman kado": "Gift delivery address",
  "Judul penutup": "Closing heading",
  "Pesan penutup": "Closing message",
  "Nama keluarga (boleh 2 baris)": "Family names (up to 2 lines)",
  "Maksimal tamu per konfirmasi": "Maximum guests per confirmation",
  "Link / ID video YouTube": "YouTube video link / ID",
  "Kosongkan untuk mematikan musik.": "Leave blank to turn the music off.",
  "Mulai dari detik ke-": "Start at second",
  "Tampil saat link dibagikan di WhatsApp dan media sosial. Kosongkan untuk otomatis.":
    "Shown when the link is shared on WhatsApp and social media. Leave blank for automatic.",
  "Judul halaman": "Page title",
  "Deskripsi singkat": "Short description",

  // ---------- Slot foto ----------
  "Foto sampul": "Cover photo",
  "Foto utama berdua (rasio potret).": "Main photo of the two of you (portrait ratio).",
  "Foto mempelai pria": "Groom's photo",
  "Foto mempelai wanita": "Bride's photo",
  "Foto kutipan": "Quote photo",
  "Foto siaran langsung": "Live stream photo",
  "Foto penutup": "Closing photo",
  "Galeri foto": "Photo gallery",
  "Foto halaman utama": "Main page photo",
  "Foto kartu pos pembuka": "Opening postcard photo",
  "galeri / sampul": "gallery / cover",
  sampul: "cover",

  // ---------- Metode & instruksi pembayaran ----------
  "TRANSFER VIRTUAL ACCOUNT": "VIRTUAL ACCOUNT TRANSFER",
  "Bayar lewat aplikasi GoPay": "Pay with the GoPay app",
  "Scan dari semua e-wallet & m-banking": "Scan from any e-wallet & mobile banking app",
  "Mobile banking / internet banking": "Mobile banking / internet banking",
  "Aplikasi GoPay / Gojek": "GoPay / Gojek app",
  "Semua e-wallet & m-banking": "Any e-wallet & mobile banking app",
  "Masukkan kartu ATM dan PIN, pilih menu Transfer / Pembayaran.":
    "Insert your ATM card and PIN, then choose Transfer / Payment.",
  "Masukkan nomor Virtual Account di atas, lalu pastikan nominal sama persis.":
    "Enter the Virtual Account number above, then make sure the amount matches exactly.",
  "Konfirmasi pembayaran dan simpan struk.": "Confirm the payment and keep the receipt.",
  "Login ke aplikasi, buka menu Transfer atau Virtual Account.":
    "Log in to the app and open the Transfer or Virtual Account menu.",
  "Masukkan nomor Virtual Account di atas (salin dari halaman ini).":
    "Enter the Virtual Account number above (copy it from this page).",
  "Periksa nama merchant & nominal, lalu konfirmasi dengan PIN / OTP.":
    "Check the merchant name and amount, then confirm with your PIN / OTP.",
  "Buka menu Bayar (Multipayment) lalu pilih penyedia jasa Midtrans / kode perusahaan yang tertera.":
    "Open the Pay (Multipayment) menu, then choose Midtrans as the service provider / the company code shown.",
  "Masukkan Kode Pembayaran di atas.": "Enter the Payment Code above.",
  "Periksa nominal, lalu konfirmasi dengan PIN.": "Check the amount, then confirm with your PIN.",
  "Di ponsel, tekan tombol Buka aplikasi GoPay. Di komputer, scan kode QR dengan aplikasi Gojek.":
    "On a phone, tap the Open GoPay app button. On a computer, scan the QR code with the Gojek app.",
  "Periksa nominal pembayaran, lalu konfirmasi dengan PIN GoPay.":
    "Check the payment amount, then confirm with your GoPay PIN.",
  "Tunggu sebentar; halaman ini berubah menjadi Lunas otomatis.":
    "Wait a moment; this page will switch to Paid automatically.",
  "Buka aplikasi e-wallet / m-banking yang mendukung QRIS.":
    "Open an e-wallet / mobile banking app that supports QRIS.",
  "Pilih Scan / Bayar, lalu arahkan kamera ke kode QR di atas.":
    "Choose Scan / Pay, then point the camera at the QR code above.",
  "Periksa nominal, lalu konfirmasi pembayaran.": "Check the amount, then confirm the payment.",

  // ---------- Pesan dari Worker / API ----------
  "Akses ditolak.": "Access denied.",
  "Akun ini hanya bisa masuk lewat Google.": "This account can only sign in with Google.",
  "Alamat link sudah dipakai. Coba yang lain.": "This link address is already taken. Try another one.",
  "Belum login.": "You are not logged in.",
  "Data tidak valid atau terlalu besar.": "Invalid or oversized data.",
  "Email atau kata sandi salah.": "Incorrect email or password.",
  "Email atau kata sandi tidak valid.": "Invalid email or password.",
  "Email belum dikonfirmasi. Cek kotak masuk Anda.": "Email not confirmed yet. Please check your inbox.",
  "Email ini tidak dapat didaftarkan.": "This email cannot be registered.",
  "Format email tidak valid.": "Invalid email format.",
  "Format foto harus JPG, PNG, atau WebP.": "Photo format must be JPG, PNG, or WebP.",
  "Format nomor WhatsApp tidak valid.": "Invalid WhatsApp number format.",
  "Foto tidak ditemukan.": "Photo not found.",
  "Gagal memuat data dashboard.": "Failed to load dashboard data.",
  "Gagal memuat pesanan.": "Failed to load the order.",
  "Gagal menyimpan profil.": "Failed to save profile.",
  "Harga template tidak valid.": "Invalid template price.",
  "Kata sandi minimal 8 karakter.": "Password must be at least 8 characters.",
  "Kata sandi terlalu lemah.": "Password is too weak.",
  "Kode voucher tidak valid atau sudah kadaluarsa.": "The voucher code is invalid or has expired.",
  "Layanan pembayaran sedang sibuk. Coba lagi sebentar lagi.":
    "The payment service is busy. Please try again shortly.",
  "Link hanya boleh huruf kecil, angka, dan tanda hubung (3–48 karakter).":
    "The link may only contain lowercase letters, numbers, and hyphens (3–48 characters).",
  "Link tidak bisa diubah setelah undangan dipublikasikan.":
    "The link can't be changed after the invitation is published.",
  "Metode pembayaran ini sedang tidak tersedia. Silakan pilih metode lain.":
    "This payment method is currently unavailable. Please choose another one.",
  "Metode pembayaran tidak valid.": "Invalid payment method.",
  "Nama lengkap minimal 2 karakter.": "Full name must be at least 2 characters.",
  "Nama minimal 2 karakter.": "Name must be at least 2 characters.",
  "Nama tamu wajib diisi (maks. 80 karakter).": "Guest name is required (max. 80 characters).",
  "Origin tidak diizinkan.": "Origin not allowed.",
  "Pembayaran belum dikonfigurasi. Hubungi admin.": "Payment isn't configured yet. Please contact the admin.",
  "Pembayaran belum dikonfigurasi.": "Payment isn't configured yet.",
  "Pendaftaran gagal. Periksa data Anda lalu coba lagi.": "Sign-up failed. Please check your details and try again.",
  "Permintaan tidak valid.": "Invalid request.",
  "Pesanan ini tidak bisa dibatalkan.": "This order can't be cancelled.",
  "Pesanan sebelumnya masih diproses. Coba lagi sebentar lagi.":
    "Your previous order is still being processed. Please try again shortly.",
  "Pesanan sebelumnya sedang diproses. Coba lagi sebentar lagi.":
    "Your previous order is being processed. Please try again shortly.",
  "Pesanan sedang diproses. Coba lagi sebentar lagi.": "Your order is being processed. Please try again shortly.",
  "Pesanan sedang diproses. Muat ulang halaman lalu coba lagi.":
    "Your order is being processed. Reload the page and try again.",
  "Pesanan tidak bisa dibatalkan karena statusnya sudah berubah.":
    "The order can't be cancelled because its status has changed.",
  "Pesanan tidak ditemukan.": "Order not found.",
  "Realtime belum tersedia.": "Realtime isn't available yet.",
  "Slot foto tidak dikenal.": "Unknown photo slot.",
  "Template belum tersedia.": "The template isn't available yet.",
  "Template ini sudah kamu bayar.": "You've already paid for this template.",
  "Template tidak ditemukan.": "Template not found.",
  "Terjadi gangguan di server. Coba lagi sebentar lagi.": "A server error occurred. Please try again shortly.",
  "Terjadi kesalahan. Coba lagi.": "Something went wrong. Please try again.",
  "Terlalu banyak koneksi untuk pesanan ini.": "Too many connections for this order.",
  "Terlalu banyak koneksi. Coba lagi sebentar lagi.": "Too many connections. Please try again shortly.",
  "Terlalu banyak percobaan. Coba lagi sebentar lagi.": "Too many attempts. Please try again shortly.",
  "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.": "Too many attempts. Please wait a moment and try again.",
  "Terlalu banyak unggahan. Coba lagi sebentar lagi.": "Too many uploads. Please try again shortly.",
  "Terlalu sering memeriksa status. Coba lagi sebentar lagi.": "Checking status too often. Please try again shortly.",
  "Tidak ada data untuk disimpan.": "There is no data to save.",
  "Total pembayaran tidak valid.": "Invalid payment total.",
  "Ucapan tidak ditemukan.": "Wish not found.",
  "Ukuran foto maksimal 5 MB.": "Maximum photo size is 5 MB.",
  "Undangan tidak ditemukan.": "Invitation not found.",
  "Voucher ini sudah pernah kamu pakai.": "You've already used this voucher.",

  // ---------- Toast & error dari komponen Studio ----------
  // (showToast di UserApp otomatis menerjemahkan lewat tr(), jadi cukup daftarkan di sini)
  "Gagal membaca file gambar.": "Failed to read the image file.",
  "Profil berhasil diperbarui!": "Profile updated successfully!",
  "Pratinjau belum tersedia untuk undangan ini.": "A preview isn't available for this invitation yet.",
  "Tautan disalin!": "Link copied!",
  "Tidak bisa menyalin otomatis. Salin tautan secara manual.": "Couldn't copy automatically. Please copy the link manually.",
  "Tautan disalin. Tempel di Instagram.": "Link copied. Paste it in Instagram.",
  "Ucapan dihapus.": "Wish deleted.",
  "Gagal menghapus ucapan. Coba lagi.": "Failed to delete the wish. Please try again.",
  "Gagal memuat ucapan.": "Failed to load wishes.",
  "Gagal memuat undangan.": "Failed to load the invitation.",
  "Gagal menyimpan. Periksa koneksi Anda.": "Failed to save. Please check your connection.",
  "Pilih file gambar (JPG, PNG, atau WebP).": "Choose an image file (JPG, PNG, or WebP).",
  "Gagal mengunggah foto.": "Failed to upload the photo.",
  "Foto tidak dapat diproses. Coba foto lain.": "The photo couldn't be processed. Try another one.",
  "Gagal menghapus foto.": "Failed to delete the photo.",
  "Lengkapi data yang wajib diisi.": "Please complete the required fields.",
  "Selesaikan langkah sebelumnya dulu.": "Please finish the previous step first.",
  "Gagal mempublikasikan.": "Failed to publish.",
  "Link undangan disalin.": "Invitation link copied.",
  "Undangan Pernikahan": "Wedding Invitation",
  "Gagal memulai pembayaran. Coba lagi.": "Failed to start the payment. Please try again.",
  "Pembayaran gagal diproses. Silakan coba lagi atau pilih metode lain.":
    "The payment couldn't be processed. Please try again or choose another method.",
  "Nomor VA disalin!": "VA number copied!",
  "Kode pembayaran disalin!": "Payment code copied!",
  "Nominal disalin!": "Amount copied!",
  "Pembayaran gagal diproses. Coba lagi atau ganti metode.": "The payment couldn't be processed. Try again or change the method.",
  "Gagal membuka pembayaran. Coba lagi.": "Failed to open the payment. Please try again.",
  "Gagal memeriksa status. Coba lagi.": "Failed to check the status. Please try again.",
  "Pembayaran diterima. Terima kasih!": "Payment received. Thank you!",
  "Status baru saja diperiksa. Coba lagi beberapa detik lagi.": "The status was just checked. Try again in a few seconds.",
  "Pembayaran belum kami terima.": "We haven't received the payment yet.",
  "Terjadi kesalahan saat memuat data pesanan.": "Something went wrong while loading the order.",

  // ---------- Pesan error dari sisi client (lib/*) ----------
  "Tidak dapat terhubung ke server.": "Unable to connect to the server.",
  "Gagal memproses foto.": "Failed to process the photo.",
  "Gagal memuat konfigurasi pembayaran": "Failed to load the payment configuration",
  "URL Snap tidak valid.": "Invalid Snap URL.",
  "Gagal memuat halaman pembayaran Midtrans.": "Failed to load the Midtrans payment page.",
  "Snap tidak tersedia.": "Snap is not available.",

  // ---------- Dash: nilai status dari Worker (worker/src/admin.ts) ----------
  Aktif: "Active",
  Nonaktif: "Inactive",
  "Belum Beli": "No Purchase Yet",
  Draf: "Draft",
  Arsip: "Archived",
};

const GROOM_BRIDE: Record<string, string> = { pria: "groom", wanita: "bride" };
const BANK_PART: Record<string, string> = { Bank: "Bank", Nomor: "Number", "Atas nama": "Account holder" };
const STORY_PART: Record<string, string> = { Tahun: "Year", Judul: "Title", Cerita: "Story" };
const COLOR_PART: Record<string, string> = { Nama: "Name", Kode: "Code" };

/** Pola berangka/berparameter (label dibuat dengan template string di shared/). */
const PATTERNS: Array<[RegExp, (m: RegExpMatchArray, tr: (s: string) => string) => string]> = [
  [/^Acara (\d+)$/, (m) => `Event ${m[1]}`],
  [/^Nama panggilan (pria|wanita)$/, (m) => `Nickname of the ${GROOM_BRIDE[m[1]]}`],
  [/^Nama lengkap (pria|wanita)$/, (m) => `Full name of the ${GROOM_BRIDE[m[1]]}`],
  [/^Rekening (\d+) · (Bank|Nomor|Atas nama)$/, (m) => `Account ${m[1]} · ${BANK_PART[m[2]]}`],
  [/^Kisah (\d+) · (Tahun|Judul|Cerita)$/, (m) => `Story ${m[1]} · ${STORY_PART[m[2]]}`],
  [/^Warna (\d+) · (Nama|Kode)$/, (m) => `Color ${m[1]} · ${COLOR_PART[m[2]]}`],
  [/^Foto kisah (\d+)$/, (m) => `Story photo ${m[1]}`],
  [/^(.+) wajib diisi\.$/, (m, tr) => `${tr(m[1])} is required.`],
  [/^(.+) wajib diunggah\.$/, (m, tr) => `${tr(m[1])} must be uploaded.`],
  [
    /^Pilih Virtual Account \(atau transfer ke bank lain jika bukan (.+)\)\.$/,
    (m) => `Choose Virtual Account (or transfer to another bank if it isn't ${m[1]}).`,
  ],
  [/^Bayar dengan (.+)$/, (m) => `Pay with ${m[1]}`],
  [
    /^Lengkapi dulu: (.*?)(…)?$/,
    (m, tr) => `Complete these first: ${m[1].split(", ").map(tr).join(", ")}${m[2] ?? ""}`,
  ],
];

/** Terjemahkan teks Indonesia eksternal. Bahasa Indonesia / tidak dikenal -> apa adanya. */
export function trPhrase(lang: Language, text: string): string {
  if (lang === "id" || !text) return text;
  const hit = EN[text];
  if (hit !== undefined) return hit;
  for (const [re, fn] of PATTERNS) {
    const m = text.match(re);
    if (m) return fn(m, (s) => trPhrase(lang, s));
  }
  return text;
}
