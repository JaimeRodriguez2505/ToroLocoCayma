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
  title: {
    default: "Toro Loco Cayma | Parrillas y Carnes a la Brasa en Arequipa",
    template: "%s | Toro Loco Cayma"
  },
  description: "Restaurante de parrillas y carnes a la brasa en Cayma, Arequipa. Anticuchos, parrilladas, chorizos artesanales y más. Reserva tu mesa ahora. Delivery disponible.",
  keywords: [
    "parrilla arequipa",
    "restaurante cayma",
    "carnes a la brasa",
    "anticuchos arequipa",
    "parrillada arequipa",
    "toro loco cayma",
    "restaurante arequipa",
    "carnes arequipa",
    "chorizo artesanal",
    "delivery parrilla arequipa"
  ],
  authors: [{ name: "Toro Loco Cayma" }],
  creator: "Toro Loco Cayma",
  publisher: "Toro Loco Cayma",
  metadataBase: new URL("https://torolococayma.com"),
  alternates: {
    canonical: "https://torolococayma.com",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "https://torolococayma.com",
    siteName: "Toro Loco Cayma",
    title: "Toro Loco Cayma | Parrillas y Carnes a la Brasa en Arequipa",
    description: "Restaurante de parrillas y carnes a la brasa en Cayma, Arequipa. Anticuchos, parrilladas, chorizos artesanales. ¡Reserva tu mesa!",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Toro Loco Cayma - Parrillas Arequipa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toro Loco Cayma | Parrillas en Arequipa",
    description: "Las mejores parrillas y carnes a la brasa en Cayma, Arequipa. ¡Reserva ahora!",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "tu-codigo-de-verificacion", // Agregar cuando tengas Google Search Console
  },
  category: "restaurant",
};

// JSON-LD Structured Data para Google
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": "https://torolococayma.com/#restaurant",
      "name": "Toro Loco Cayma",
      "image": "https://torolococayma.com/logo.png",
      "url": "https://torolococayma.com",
      "telephone": "+51999999999",
      "priceRange": "$$",
      "servesCuisine": ["Parrilla", "Carnes a la brasa", "Peruana"],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Cayma",
        "addressLocality": "Arequipa",
        "addressRegion": "Arequipa",
        "postalCode": "04017",
        "addressCountry": "PE"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -16.3989,
        "longitude": -71.5350
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "12:00",
          "closes": "22:00"
        }
      ],
      "sameAs": [
        "https://www.facebook.com/torolococayma",
        "https://www.instagram.com/torolococayma"
      ],
      "hasMenu": "https://torolococayma.com/menu"
    },
    {
      "@type": "WebSite",
      "@id": "https://torolococayma.com/#website",
      "url": "https://torolococayma.com",
      "name": "Toro Loco Cayma",
      "description": "Restaurante de parrillas y carnes a la brasa en Cayma, Arequipa",
      "publisher": {
        "@id": "https://torolococayma.com/#restaurant"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://torolococayma.com/menu?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://torolococayma.com/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Inicio",
          "item": "https://torolococayma.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Carta",
          "item": "https://torolococayma.com/menu"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Promociones",
          "item": "https://torolococayma.com/promociones"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Nosotros",
          "item": "https://torolococayma.com/nosotros"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "Ubicacion",
          "item": "https://torolococayma.com/ubicacion"
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable} ${permanentMarker.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
