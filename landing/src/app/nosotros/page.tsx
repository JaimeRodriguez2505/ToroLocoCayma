import type { Metadata } from "next";
import About from "@/components/About";
import Gallery from "@/components/Gallery";

export const metadata: Metadata = {
  title: "Nosotros | Toro Loco Cayma",
  description: "Conoce la historia detrás de la mejor parrilla de Arequipa. Tradición, pasión y fuego desde 2015.",
};

export default function NosotrosPage() {
  return (
    <div className="pt-20"> {/* Padding top para compensar header fijo */}
      <About />
      <Gallery />
    </div>
  );
}
