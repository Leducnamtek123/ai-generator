import crypto from 'crypto';

type OAuthStatePayload = {
  extraParams?: Record<string, string>;
  issuedAt: number;
};

export function buildSignedOAuthState(
  secret: string,
  extraParams: Record<string, string> = {},
): string {
  const payload: OAuthStatePayload = {
    extraParams,
    issuedAt: Date.now(),
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');

  return Buffer.from(
    JSON.stringify({
      payload,
      signature,
    }),
  ).toString('base64url');
}

export function verifySignedOAuthState(
  secret: string,
  state: string,
  ttlMs: number,
): Record<string, string> {
  const decoded = JSON.parse(
    Buffer.from(state, 'base64url').toString('utf8'),
  ) as {
    payload?: OAuthStatePayload;
    signature?: string;
  };

  if (!decoded.payload?.issuedAt || !decoded.signature) {
    throw new Error('Missing OAuth state signature');
  }

  if (Date.now() - decoded.payload.issuedAt > ttlMs) {
    throw new Error('OAuth state expired');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(decoded.payload))
    .digest('hex');

  if (expectedSignature !== decoded.signature) {
    throw new Error('OAuth state signature mismatch');
  }

  return decoded.payload.extraParams ?? {};
}
