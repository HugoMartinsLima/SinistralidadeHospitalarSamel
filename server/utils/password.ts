const encoder = new TextEncoder();

export function hashPassword(password: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(encoder.encode(password));
  return hasher.digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const passwordHash = hashPassword(password);
  return passwordHash === hash;
}
