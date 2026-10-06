/**
 * Secure hashing utility using SHA-256.
 * The secret word is never stored or transmitted in plain text.
 */
export async function hashSecret(secret: string, salt: string = 'mascoticas_secure_salt_v1'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${secret.trim().toLowerCase()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function normalizePlayerId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_');
}
