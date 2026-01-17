import type { Metadata } from "next";
import PromoGrid from "@/components/PromoGrid";

export const metadata: Metadata = {
  title: "Promociones | Toro Loco Cayma",
  description: "Aprovecha nuestras ofertas exclusivas y promociones ardientes. La mejor parrilla al mejor precio.",
};

export default function PromocionesPage() {
  return (
    <div className="pt-20">
      <PromoGrid />
    </div>
  );
}
