const DEFAULT_API_URL = 'http://localhost:8000/api/v1';

export interface StoredFileRecord {
  id: string;
  path: string;
}

export interface StoredFileResponse {
  file: StoredFileRecord;
}

export interface ResolvedStoredFile extends StoredFileRecord {
  url: string;
}

function toProxyableApiPath(path: string): string | null {
  if (!/^https?:\/\//i.test(path)) {
    return null;
  }

  try {
    const url = new URL(path);
    if (url.pathname.startsWith('/api/v1/')) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }

  return null;
}

export function getFileUrl(path: string): string {
  if (!path) return '';

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  const origin = baseUrl.replace(/\/api\/v1$/, '');

  if (/^https?:\/\//i.test(path)) {
    const proxyPath = toProxyableApiPath(path);
    if (proxyPath) {
      return `${origin}${proxyPath}`;
    }

    try {
      const url = new URL(path);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return `${origin}${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      // Fall through and return the original path below.
    }

    return path;
  }

  const normalizedPath = path.replace(/^\/+/, '');

  if (normalizedPath.startsWith('api/')) {
    return `${origin}/${normalizedPath}`;
  }

  if (normalizedPath.startsWith('files/')) {
    return `${baseUrl}/${normalizedPath}`;
  }

  return `${baseUrl}/files/${normalizedPath}`;
}

export function resolveDisplayFileUrl(path: string): string {
  if (!path) return '';

  if (/^(blob:|data:|https?:\/\/)/i.test(path)) {
    const proxyPath = toProxyableApiPath(path);
    if (proxyPath) {
      return proxyPath;
    }

    return path;
  }

  return getFileUrl(path);
}

export function resolveStoredFile(file: StoredFileRecord): ResolvedStoredFile {
  return {
    ...file,
    url: resolveDisplayFileUrl(file.path),
  };
}
