import { createHmac, timingSafeEqual } from 'crypto';

const KIND = 'kiosk-visit';

export type VisitQrPayload = {
  kind: typeof KIND;
  kioskId: string;
  date: string;
};

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function dayRange(dateKey: string) {
  const from = new Date(`${dateKey}T00:00:00.000Z`);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

export function createVisitQrToken(kioskId: string, secret: string, now = new Date()) {
  const payload: VisitQrPayload = { kind: KIND, kioskId, date: todayKey(now) };
  const encodedPayload = base64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function createVisitCode(kioskId: string, secret: string, now = new Date()) {
  const seed = `${KIND}:${kioskId}:${todayKey(now)}`;
  return sign(seed, secret).replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase();
}

export function verifyVisitQrToken(token: string, secret: string): VisitQrPayload | null {
  const [encodedPayload, signature] = token.trim().split('.');
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload, secret);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (
      payload?.kind !== KIND ||
      typeof payload.kioskId !== 'string' ||
      typeof payload.date !== 'string'
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function verifyVisitCode(code: string, kioskId: string, secret: string, now = new Date()) {
  const expected = createVisitCode(kioskId, secret, now);
  const normalized = code.trim().toUpperCase();
  const expectedBuffer = Buffer.from(expected);
  const codeBuffer = Buffer.from(normalized);
  return (
    expectedBuffer.length === codeBuffer.length &&
    timingSafeEqual(expectedBuffer, codeBuffer)
  );
}
