-- Seed Data untuk Satu Cerita (Katalog Template Awal)

insert into public.templates (slug, name, category, tier, original_price, discount_price, thumbnail_url, preview_url, frame_bg)
values
  (
    'elysian-bloom-gold',
    'Elysian Bloom (Gold Edition)',
    'WEDDING',
    'elysian',
    199000,
    149000,
    '/logos/satucerita.png',
    'https://satucerita.zanxa.studio/katalog',
    'linear-gradient(135deg, #2b1f3d 0%, #171226 100%)'
  ),
  (
    'deluxe-royal-navy',
    'Deluxe Royal Navy & Pearl',
    'WEDDING',
    'deluxe',
    149000,
    99000,
    '/logos/satucerita.png',
    'https://satucerita.zanxa.studio/katalog',
    'linear-gradient(135deg, #101c38 0%, #0a0f1d 100%)'
  ),
  (
    'minimalist-modern-flora',
    'Minimalist Modern Flora',
    'WEDDING',
    'elysian',
    199000,
    149000,
    '/logos/satucerita.png',
    'https://satucerita.zanxa.studio/katalog',
    'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
  ),
  (
    'rustic-autumn-breeze',
    'Rustic Autumn Breeze',
    'WEDDING',
    'standard',
    99000,
    69000,
    '/logos/satucerita.png',
    'https://satucerita.zanxa.studio/katalog',
    'linear-gradient(135deg, #2c1a11 0%, #180d07 100%)'
  )
on conflict (slug) do nothing;
