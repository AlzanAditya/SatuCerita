/** Rate limit via Workers Rate Limiting binding. Tidak ada binding / error -> diizinkan (fail-open), karena
 *  perlindungan utama tetap ada di database (unique index, idempotency key, cooldown sync). */
export async function allow(rl: RateLimit | undefined, key: string): Promise<boolean> {
  if (!rl) return true;
  try {
    return (await rl.limit({ key })).success;
  } catch {
    return true;
  }
}
