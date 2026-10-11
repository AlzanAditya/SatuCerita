# Supabase Configuration - Satu Cerita

Folder ini menyimpan konfigurasi, skema migrasi database PostgreSQL, dan data benih (seed) untuk backend Satu Cerita.

## Struktur
- `config.toml`: Pengaturan Supabase CLI lokal
- `migrations/20260101000000_initial_schema.sql`: Skema lengkap (profiles, templates, invitations, orders, rsvps, guestbook, RLS & triggers)
- `seed.sql`: Data awal template undangan Satu Cerita

## Perintah CLI
```bash
# Menjalankan Supabase lokal
npx supabase start

# Terapkan migrasi ke database remote
npx supabase db push

# Generate TypeScript types dari database
npx supabase gen types typescript --local > src/types/supabase.ts
```
