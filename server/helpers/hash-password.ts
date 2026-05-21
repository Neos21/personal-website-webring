export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
};
