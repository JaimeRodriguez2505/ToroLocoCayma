import type { Metadata } from "next";
import ElegantMenu from "@/components/ElegantMenu";
import { getEcommerceCategories, getEcommerceProducts } from "@/lib/toroApi";

export const metadata: Metadata = {
  title: "Carta Gourmet | Toro Loco Cayma",
  description: "Descubre nuestra exclusiva carta de cortes premium y sabores al fuego en una experiencia digital elegante.",
};

// Force dynamic rendering to avoid build-time fetch errors
export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const [categories, products] = await Promise.all([
    getEcommerceCategories(),
    getEcommerceProducts(),
  ]);

  return (
    <main className="w-full min-h-screen bg-[#080808]">
      <ElegantMenu initialCategories={categories} initialProducts={products} />
    </main>
  );
}
