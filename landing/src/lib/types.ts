export type EcommerceBanner = {
  id_banner: number;
  imagen_url: string | null;
  whatsapp: string | null;
  titulo: string | null;
  descripcion: string | null;
  creado_en?: string;
  actualizado_en?: string;
};

export type EcommerceTarjeta = {
  id_tarjeta: number;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  creado_en?: string;
  actualizado_en?: string;
};

export type EcommerceCategory = {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
};

export type EcommerceProduct = {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  es_oferta: boolean;
  precio_oferta: string | null;
  imagen_url: string | null;
  id_categoria: number;
  categoria?: {
    nombre: string | null;
  };
};

export type EcommerceProductOffer = EcommerceProduct;

export type EcommerceReclamoRequest = {
  nombre: string;
  email: string;
  telefono?: string;
  descripcion: string;
};
