export function sanitizeAppPath(path: string | null | undefined, fallback = '/dashboard') {
    if (!path) return fallback;
    if (!path.startsWith('/')) return fallback;
    if (path.startsWith('//')) return fallback;
    if (/^https?:\/\//i.test(path)) return fallback;

    return path;
}
