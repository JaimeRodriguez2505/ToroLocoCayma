export function getBackendBaseUrl() {
  // En el servidor (SSR/SSG), usar la URL interna de Docker
  // En el cliente (navegador), usar la URL pública
  if (typeof window === 'undefined') {
    // Server-side: usar URL interna de Docker
    return process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://backend:3000";
  } else {
    // Client-side: usar URL pública accesible desde el navegador
    return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4241";
  }
}

export function toAbsoluteUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;

  // Sanitize: remove trailing colon and whitespace
  let cleanUrl = pathOrUrl.trim();
  while (cleanUrl.endsWith(':')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    // Si la URL contiene el hostname interno de Docker, reemplazarlo con la URL pública
    if (cleanUrl.includes('http://backend:3000')) {
      cleanUrl = cleanUrl.replace('http://backend:3000', process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4241');
    }
    return normalizeLocalhostProtocol(cleanUrl);
  }
  const base = getBackendBaseUrl().replace(/\/$/, "");
  const path = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  return `${base}${path}`;
}

// Alias para compatibilidad con componentes existentes
export const getBackendUrl = (pathOrUrl: string | null): string => {
  const url = toAbsoluteUrl(pathOrUrl);
  return url || ''; // Retorna string vacío si es null para evitar errores en src de Image
};

export function normalizeLocalhostProtocol(url: string) {
  try {
    const u = new URL(url);
    if (
      (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
      u.protocol === "https:"
    ) {
      u.protocol = "http:";
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export function toWhatsappLink(raw: string | null) {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}
