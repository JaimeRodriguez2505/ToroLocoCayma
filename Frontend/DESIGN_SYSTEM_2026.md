# Sistema de Diseño 2026 - Toro Loco ERP

Esta guía define los patrones de diseño que deben seguirse en toda la aplicación.

## 🎨 Colores

### Uso de Colores
```tsx
// Primario (Rojo intenso)
className="bg-primary text-primary-foreground"        // Botones de acción principal
className="text-primary"                              // Precios, totales, énfasis
className="border-primary"                            // Borders destacados

// Backgrounds
className="bg-background"                             // Fondo principal
className="bg-card"                                   // Cards y secciones
className="bg-muted"                                  // Secciones secundarias
className="bg-accent"                                 // Hover states

// Texto
className="text-foreground"                           // Texto principal
className="text-muted-foreground"                     // Texto secundario
className="text-primary"                              // Texto destacado

// Bordes
className="border-border"                             // Todos los bordes
className="border-primary"                            // Bordes destacados
```

---

## 🔘 Botones

### Tamaños Estándar
```tsx
// Desktop y Mobile
<Button size="default">Acción</Button>                // h-10 (40px)
<Button size="md">Acción Móvil</Button>              // h-12 (48px) - Mobile friendly
<Button size="lg">Acción Grande</Button>             // h-14 (56px) - Táctil

// Icons
<Button size="icon">Icon</Button>                     // h-10 w-10
<Button size="icon" className="h-12 w-12">Icon</Button>  // Móvil
```

### Variantes
```tsx
<Button variant="default">Primary</Button>            // Rojo con glow en dark
<Button variant="outline">Secondary</Button>          // Border con hover
<Button variant="ghost">Subtle</Button>               // Sin background
<Button variant="destructive">Eliminar</Button>       // Destructivo
```

### Estilo Consistente
```tsx
// Siempre usar rounded-xl
className="rounded-xl"

// Dark mode shadows
className="dark:shadow-fire"          // Botones primarios
className="dark:shadow-ember"         // Botones secundarios
```

---

## 🃏 Cards

### Estructura Estándar
```tsx
<Card className="overflow-hidden">
  <CardHeader>
    <CardTitle>Título en Poppins</CardTitle>
    <CardDescription>Descripción opcional</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
  <CardFooter>
    {/* Acciones */}
  </CardFooter>
</Card>
```

### Variantes
```tsx
// Default
<Card>...</Card>                                      // bg-card, border, shadow-sm

// Elevated
<Card variant="elevated">...</Card>                   // Shadow más pronunciado

// Interactive
<Card variant="interactive">...</Card>                // Hover effects, cursor pointer

// Fire (destacado)
<Card variant="fire">...</Card>                       // Gradiente rojo, shadow-fire

// Con glow en dark
<Card className="dark:shadow-ember">...</Card>
<Card className="border-2 border-primary dark:shadow-fire">...</Card>
```

### Border Radius
```tsx
// SIEMPRE usar rounded-2xl en cards principales
className="rounded-2xl"

// Cards pequeños o nested
className="rounded-xl"
```

---

## 📝 Inputs y Forms

### Inputs
```tsx
<Input
  placeholder="Texto..."
  inputSize="default"              // h-12 (48px) - Mobile friendly
  className="h-14"                 // h-14 (56px) - Extra táctil
/>
```

### Textarea
```tsx
<textarea
  className="w-full h-24 p-4 border-2 border-border rounded-xl resize-none
             bg-background text-base
             focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20
             dark:focus:shadow-primary-glow transition-all"
/>
```

### Labels
```tsx
<label className="text-sm font-semibold text-foreground">
  Campo
</label>
```

---

## 📐 Spacing

### Gaps y Padding
```tsx
// Secciones
className="space-y-6"                // Entre secciones grandes
className="space-y-4"                // Entre cards/items
className="space-y-3"                // Entre elementos relacionados
className="gap-4"                    // Grid/flex gaps

// Padding en Cards
className="p-6"                      // Card content desktop
className="p-4"                      // Card content mobile
className="px-4 py-3"               // Inputs

// Margins
className="mb-6"                     // Entre secciones
className="mb-4"                     // Entre grupos
```

### Container
```tsx
// Páginas principales
<div className="p-6 max-w-7xl mx-auto">
  {/* Contenido */}
</div>

// Mobile
<div className="p-4">
  {/* Contenido */}
</div>
```

---

## 🎭 Efectos y Shadows

### Dark Mode Glows
```tsx
// Botones primarios
className="dark:shadow-fire dark:hover:shadow-fire-lg"

// Cards importantes
className="dark:shadow-ember"

// Headers
className="dark:shadow-ember"

// Elementos flotantes
className="shadow-2xl dark:shadow-fire-lg"

// Focus states en inputs
className="dark:focus:shadow-primary-glow"
```

### Hover States
```tsx
// Cards clickables
className="hover:border-primary/50 hover:-translate-y-0.5 transition-all"

// Botones
className="hover:bg-accent"          // Ghost buttons
className="hover:bg-primary/90"      // Primary buttons
```

### Active States
```tsx
className="active:scale-95 active:bg-accent"
```

---

## 📱 Responsive

### Breakpoints
```tsx
// Mobile first
className="p-4 md:p-6"
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
className="text-base md:text-lg"

// Hide/Show
className="hidden md:block"
className="block md:hidden"
```

### Touch Targets
```tsx
// Mínimo 48px en mobile
className="h-12 w-12"                // Touch friendly
className="h-14"                     // Extra táctil
className="tap-target"               // Utility class para touch
```

---

## 🔤 Typography

### Hierarchy
```tsx
// Titles (Poppins)
<h1 className="text-4xl font-bold">Título Principal</h1>      // 40px
<h2 className="text-3xl font-bold">Título Sección</h2>        // 32px
<h3 className="text-2xl font-bold">Título Subsección</h3>     // 24px

// Body (Inter)
<p className="text-base">Texto normal</p>                     // 16px
<p className="text-sm text-muted-foreground">Texto secundario</p>  // 14px

// Emphasis
<span className="font-semibold">Destacado</span>
<span className="font-bold text-primary">Muy destacado</span>
```

### Precios y Totales
```tsx
<span className="text-2xl font-bold text-primary">
  S/ 150.00
</span>
```

---

## 📊 Tables

### Estructura
```tsx
<Card className="overflow-hidden">
  <CardHeader>
    <CardTitle>Lista</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Columna</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="hover:bg-accent cursor-pointer">
          <TableCell>Data</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

## 🏷️ Badges

### Uso
```tsx
<Badge>Default</Badge>                          // bg-primary
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>

// Custom colors
<Badge className="bg-emerald-600">Success</Badge>
<Badge className="bg-amber-500">Warning</Badge>
```

---

## 📋 Tabs

### Mobile Friendly
```tsx
<Tabs value={tab} onValueChange={setTab}>
  <TabsList className="grid w-full grid-cols-3 h-14">
    <TabsTrigger value="1" className="text-base">
      <Icon className="h-5 w-5 mr-2" />
      <span className="hidden sm:inline">Label</span>
    </TabsTrigger>
  </TabsList>

  <TabsContent value="1" className="p-4">
    {/* Content */}
  </TabsContent>
</Tabs>
```

---

## 🎬 Animations

### Framer Motion
```tsx
// Tap feedback
<motion.div whileTap={{ scale: 0.97 }}>
  {/* Content */}
</motion.div>

// Hover
<motion.div whileHover={{ scale: 1.02 }}>
  {/* Content */}
</motion.div>

// Layout animations
<motion.div layout>
  {/* Content */}
</motion.div>

// Entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, x: -100 }}
>
  {/* Content */}
</motion.div>
```

---

## ✅ Checklist por Página

Al actualizar una página, verificar:

- [ ] Cards usan `rounded-2xl`
- [ ] Botones usan `rounded-xl` con heights apropiados (h-12+)
- [ ] Inputs usan `h-12` o `h-14`
- [ ] Spacing generoso (gap-4, space-y-4)
- [ ] Colores del sistema (primary, muted, accent, border)
- [ ] Shadows en dark mode (ember/fire)
- [ ] Typography (Poppins para títulos, Inter para body)
- [ ] Responsive (mobile first)
- [ ] Touch targets (mínimo 48px en mobile)
- [ ] Hover/active states definidos
- [ ] Focus states con ring-4 y glow

---

## 📱 Ejemplos por Tipo de Página

### Lista de Items (Products, Sales, etc.)
```tsx
<div className="p-6 max-w-7xl mx-auto">
  <div className="flex items-center justify-between mb-6">
    <h1 className="text-3xl font-bold">Título</h1>
    <Button size="md">
      <Plus className="h-5 w-5 mr-2" />
      Nuevo
    </Button>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map(item => (
      <Card key={item.id} variant="interactive">
        <CardContent className="p-6">
          {/* Content */}
        </CardContent>
      </Card>
    ))}
  </div>
</div>
```

### Formulario
```tsx
<Card className="max-w-2xl mx-auto">
  <CardHeader>
    <CardTitle>Formulario</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <label className="text-sm font-semibold mb-2 block">
        Campo
      </label>
      <Input inputSize="default" placeholder="Valor..." />
    </div>

    {/* More fields */}
  </CardContent>
  <CardFooter className="flex gap-3">
    <Button variant="outline" className="flex-1">
      Cancelar
    </Button>
    <Button className="flex-1">
      Guardar
    </Button>
  </CardFooter>
</Card>
```

### Dashboard con Stats
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {stats.map(stat => (
    <Card key={stat.id}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-primary">
              {stat.value}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

---

## 🎯 Reglas de Oro

1. **Mobile First**: Diseñar primero para móvil, luego expandir
2. **Touch Friendly**: Mínimo 48px de altura para elementos interactivos
3. **Spacing Generoso**: No apiñar elementos, usar gap-4/space-y-4
4. **Contraste WCAG AA**: Siempre verificar contraste de texto
5. **Consistencia**: Usar siempre los mismos patterns
6. **Feedback Visual**: Hover, active, focus states en todo
7. **Dark Mode**: Siempre agregar shadows (ember/fire)
8. **Animations**: Suaves y rápidas (200ms duration)
9. **Typography**: Poppins para títulos, Inter para body
10. **Colors**: Solo usar primary (rojo), resto neutros (muted, accent, border)
