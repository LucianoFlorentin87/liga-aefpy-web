const attempts = new Map<string, { count: number; expires: number }>();
/** Best-effort anti-abuse only; database uniqueness and approval enforce enrollment. */
export function allowLeagueApplication(key: string, now = Date.now()) {
  for (const [ip, value] of attempts) if (value.expires <= now) attempts.delete(ip);
  const old = attempts.get(key);
  if (old && old.count >= 5) return false;
  if (old) old.count += 1;
  else {
    if (attempts.size >= 5000) return false;
    attempts.set(key, { count: 1, expires: now + 10 * 60 * 1000 });
  }
  return true;
}
