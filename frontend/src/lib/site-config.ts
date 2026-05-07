export type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function mergeDeep<T>(base: T, override?: unknown): T {
  if (override === undefined || override === null) {
    return base;
  }

  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : base) as T;
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const result: PlainObject = { ...base };

    for (const [key, value] of Object.entries(override)) {
      const current = (base as PlainObject)[key];
      result[key] = mergeDeep(current, value);
    }

    return result as T;
  }

  return override as T;
}
