# Páginas Faltantes - Landing Page

## 📄 Páginas que necesitan crearse

Las siguientes páginas están enlazadas en el Footer pero aún no existen (devuelven 404):

### 1. `/terminos` - Términos y Condiciones
**Archivo**: `src/app/terminos/page.tsx`

**Contenido sugerido**:
- Términos de uso del sitio web
- Condiciones de reservas
- Política de cancelaciones
- Términos de compra/delivery (si aplica)

### 2. `/privacidad` - Política de Privacidad
**Archivo**: `src/app/privacidad/page.tsx`

**Contenido sugerido**:
- Recopilación de datos personales
- Uso de cookies
- Protección de datos (GDPR, Ley de Protección de Datos Personales de Perú)
- Derechos del usuario

### 3. `/reservas` - Sistema de Reservas (Opcional)
**Archivo**: `src/app/reservas/page.tsx`

**Nota**: Ya existe un formulario de reservas integrado. Esta página podría:
- Mostrar el formulario de reservas
- Mostrar disponibilidad
- Gestionar reservas existentes
- O simplemente redirigir a la sección de contacto

## ✅ Páginas que ya existen

- ✅ `/` - Home
- ✅ `/nosotros` - Sobre nosotros
- ✅ `/menu` - Carta digital
- ✅ `/promociones` - Promociones y ofertas
- ✅ `/reclamaciones` - Libro de reclamaciones
- ✅ `/ubicacion` - Ubicación y contacto

## 🔧 Cómo crear las páginas faltantes

### Ejemplo: Crear página de Términos

1. Crear el archivo:
```bash
mkdir -p src/app/terminos
touch src/app/terminos/page.tsx
```

2. Contenido básico:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Toro Loco Cayma",
  description: "Términos y condiciones de uso del sitio web de Toro Loco Cayma.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-toro-black text-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-toro-red">
          Términos y Condiciones
        </h1>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Uso del Sitio Web</h2>
            <p className="text-gray-300 leading-relaxed">
              Al acceder y utilizar este sitio web, aceptas estos términos y condiciones...
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Reservas</h2>
            <p className="text-gray-300 leading-relaxed">
              Las reservas realizadas a través de nuestro sitio web están sujetas...
            </p>
          </section>

          {/* Más secciones */}
        </div>
      </div>
    </div>
  );
}
```

### Ejemplo: Crear página de Privacidad

Similar a la de términos, pero con contenido específico de privacidad:

```tsx
// src/app/privacidad/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Toro Loco Cayma",
  description: "Política de privacidad y protección de datos de Toro Loco Cayma.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-toro-black text-white pt-24 pb-16">
      {/* Similar estructura */}
    </div>
  );
}
```

## 📝 Plantilla de Contenido Legal

Para generar el contenido legal, puedes:

1. **Usar generadores online**:
   - [Termly](https://termly.io/products/terms-and-conditions-generator/)
   - [GetTerms](https://getterms.io/)
   - [TermsFeed](https://www.termsfeed.com/)

2. **Adaptar para Perú**:
   - Incluir referencia a la Ley N° 29733 (Ley de Protección de Datos Personales)
   - Incluir información sobre INDECOPI
   - Adaptación a normativa peruana de comercio electrónico

3. **Consultar con legal**:
   - Para un restaurante, es recomendable tener asesoría legal
   - Especialmente para términos de reservas y cancelaciones

## 🚨 Mientras tanto

Si no puedes crear estas páginas inmediatamente, puedes:

### Opción 1: Quitar los links del Footer temporalmente
```tsx
// En Footer.tsx, comentar o eliminar los links:
// <li><Link href="/terminos" ...>Términos y Condiciones</Link></li>
// <li><Link href="/privacidad" ...>Política de Privacidad</Link></li>
```

### Opción 2: Crear páginas placeholder
```tsx
// src/app/terminos/page.tsx
export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-toro-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Página en Construcción</h1>
        <p className="text-gray-400">Esta página estará disponible próximamente.</p>
      </div>
    </div>
  );
}
```

### Opción 3: Redirigir a otra página
```tsx
// src/app/terminos/page.tsx
import { redirect } from 'next/navigation';

export default function TerminosPage() {
  redirect('/');
}
```

## 🔍 Verificar Links Rotos

Para encontrar todos los links del sitio:

```bash
grep -r "href=\"/" landing/src --include="*.tsx" | grep -v "node_modules"
```

## 📋 Checklist de Implementación

- [ ] Crear `/terminos` page
- [ ] Crear `/privacidad` page
- [ ] Decidir qué hacer con `/reservas` (ya existe formulario en home)
- [ ] Revisar contenido legal con asesor
- [ ] Adaptar a normativa peruana
- [ ] Probar todos los links del Footer
- [ ] Verificar SEO metadata de las nuevas páginas
