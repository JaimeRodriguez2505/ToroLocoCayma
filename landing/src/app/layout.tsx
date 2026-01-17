import type { Metadata } from "next";
import { Playfair_Display, Inter, Permanent_Marker } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import CartSidebar from "@/components/cart/CartSidebar";
import CartButton from "@/components/cart/CartButton";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const permanentMarker = Permanent_Marker({
  variable: "--font-brush",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Toro Loco Cayma | La Mejor Parrilla de Arequipa",
  description: "Disfruta de las mejores carnes y parrillas en Toro Loco Cayma. Tradición, fuego y sabor en cada bocado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable} ${permanentMarker.variable}`}>
      <body className="antialiased bg-toro-black text-text-primary min-h-screen flex flex-col bg-noise">
        <CartProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <CartSidebar />
          <CartButton />
        </CartProvider>
      </body>
    </html>
  );
}
