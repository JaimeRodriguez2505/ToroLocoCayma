import type {
  EcommerceBanner,
  EcommerceCategory,
  EcommerceProduct,
  EcommerceProductOffer,
  EcommerceReclamoRequest,
  EcommerceTarjeta,
} from "@/lib/types";
import { getBackendBaseUrl, toAbsoluteUrl } from "@/lib/url";

async function httpGetJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBackendBaseUrl().replace(/\/$/, "");

  const fetchInit: (RequestInit & { next?: { revalidate?: number | false } }) = {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  };

  if (typeof window === "undefined") {
    fetchInit.next = { revalidate: 60 };
  }

  const res = await fetch(`${base}${path}`, fetchInit);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Error ${res.status} al consultar ${path}${text ? `: ${text}` : ""}`
    );
  }

  return (await res.json()) as T;
}

function withAbsoluteImageUrl<T extends { imagen_url: string | null }>(item: T): T {
  return {
    ...item,
    imagen_url: toAbsoluteUrl(item.imagen_url),
  };
}

export async function getEcommerceBanner(): Promise<EcommerceBanner | null> {
  try {
    const data = await httpGetJson<EcommerceBanner>("/api/ecommerce/banner");
    return withAbsoluteImageUrl(data);
  } catch {
    return null;
  }
}

export async function getEcommerceBanners(): Promise<EcommerceBanner[]> {
  const data = await httpGetJson<EcommerceBanner[]>("/api/ecommerce/banners");
  return data.map(withAbsoluteImageUrl);
}

export async function getEcommerceTarjetas(): Promise<EcommerceTarjeta[]> {
  const data = await httpGetJson<EcommerceTarjeta[]>("/api/ecommerce/tarjetas");
  return data.map(withAbsoluteImageUrl);
}

export async function getEcommerceCategories(): Promise<EcommerceCategory[]> {
  const data = await httpGetJson<EcommerceCategory[]>("/api/ecommerce/categorias");
  return data.map(withAbsoluteImageUrl);
}

export async function getEcommerceProducts(): Promise<EcommerceProduct[]> {
  const data = await httpGetJson<EcommerceProduct[]>("/api/ecommerce/productos");
  return data.map(withAbsoluteImageUrl);
}

export async function getEcommerceProductsByCategory(categoryId: number): Promise<EcommerceProduct[]> {
  const data = await httpGetJson<EcommerceProduct[]>(`/api/ecommerce/categorias/${categoryId}/productos`);
  return data.map(withAbsoluteImageUrl);
}

export async function getEcommerceOffers(): Promise<EcommerceProductOffer[]> {
  const data = await httpGetJson<EcommerceProductOffer[]>("/api/ecommerce/ofertas");
  return data.map(withAbsoluteImageUrl);
}

export async function postEcommerceReclamo(body: EcommerceReclamoRequest) {
  const base = getBackendBaseUrl().replace(/\/$/, "");
  const res = await fetch(`${base}/api/ecommerce/libro-reclamaciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `No se pudo enviar el reclamo (${res.status})${text ? `: ${text}` : ""}`
    );
  }

  return res.json().catch(() => null);
}

export interface ReservaData {
  nombre: string;
  telefono: string;
  fecha_reserva: string;
  cantidad_personas: string;
  comentarios?: string;
}

export async function postReserva(data: ReservaData) {
    const base = getBackendBaseUrl().replace(/\/$/, "");
    const res = await fetch(`${base}/api/reservas`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        throw new Error("Error al crear reserva");
    }

    return await res.json();
}

export async function postReservaComprobante(id: number, file: File) {
    const base = getBackendBaseUrl().replace(/\/$/, "");
    const formData = new FormData();
    formData.append("comprobante_reserva", file);

    const res = await fetch(`${base}/api/reservas/${id}/comprobante`, {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        throw new Error("Error al subir comprobante");
    }

    return await res.json();
}
