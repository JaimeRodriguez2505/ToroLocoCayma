import type { Metadata } from "next";
import Contact from "@/components/Contact";

export const metadata: Metadata = {
  title: "Ubicación y Contacto | Toro Loco Cayma",
  description: "Visítanos en Cayma, Arequipa. Horarios de atención, reservas y libro de reclamaciones.",
};

export default function UbicacionPage() {
  return (
    <div className="pt-20">
      <Contact />
    </div>
  );
}
