// Simple auth without JWT - just cookie with user ID
export function createToken(payload: { userId: number; email: string; role: string }) {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function verifyToken(token: string) {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString()) as { userId: number; email: string; role: string };
  } catch {
    return null;
  }
}
