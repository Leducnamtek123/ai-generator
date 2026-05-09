const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
];

export function normalizeFrontendOrigins(value?: string): string[] {
  if (!value) {
    return [];
  }

  const seen = new Set<string>();

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return '';
      }
    })
    .filter((origin) => {
      if (!origin || seen.has(origin)) {
        return false;
      }

      seen.add(origin);
      return true;
    });
}

export function resolveFrontendRedirectBase(value?: string): string | undefined {
  return normalizeFrontendOrigins(value)[0];
}

export function resolveSocialHubSocketOrigins(value?: string): string[] {
  const configuredOrigins = normalizeFrontendOrigins(value);
  return configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_DEV_ORIGINS;
}
