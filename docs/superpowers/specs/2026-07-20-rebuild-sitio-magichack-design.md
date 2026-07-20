# Rebuild del sitio MagicHack — Diseño

**Fecha:** 2026-07-20
**Estado:** aprobado en brainstorming, pendiente de plan de implementación

---

## 1. Contexto

El sitio actual es un export estático de Webflow (última publicación: 20 jul 2026). Vive en la carpeta raíz del proyecto y consta de 8 páginas HTML, 3 hojas de CSS, un bundle de JS y 122 imágenes.

Estado medido del sitio actual:

| Métrica | Valor |
|---|---|
| Páginas HTML | 8 |
| `index.html` | 1031 líneas |
| `webflow.js` | 686 KB, **una sola línea** (minificado) |
| jQuery 3.5.1 | ~90 KB, desde CloudFront |
| Imágenes | 122 archivos, 24.18 MB (102 PNG, 12 JPEG, 8 SVG) |
| — de las cuales originales | 38 |
| — variantes `-p-500`/`-p-800`/… | 84 |
| Interacciones `data-w-id` | 27 (index 7, contact 10, case-study 10) |

### Problemas concretos detectados

1. **El formulario de contacto no funciona.** `contact.html:540` declara `<form method="get">` sin `action`. Los formularios de Webflow solo operan alojados en Webflow; en este export el botón "Initiate sequence" no envía nada a ningún lado.
2. **Las fuentes cargan mal.** Oswald se carga vía la librería externa `webfont.js` (request bloqueante). Inter se carga vía un `@import` dentro de un `<style>` en la **línea ~206 del `<body>`**, no en el `<head>` — el navegador no descubre la fuente hasta parsear medio documento. Causa parpadeo de fuente (FOUT).
3. **Duplicación estructural.** Nav y footer están repetidos en los 8 archivos. Cada case study es un HTML copiado a mano.
4. **Riesgo de sobrescritura.** Si alguien vuelve a exportar desde Webflow, pisa cualquier cambio local. No hay control de versiones en la carpeta.

---

## 2. Objetivos

1. **Independencia de Webflow.** Control total del código, sin riesgo de que un re-export borre el trabajo.
2. **Contenido gestionable** sin editar HTML a mano.
3. **Backend funcional** para capturar leads del formulario.
4. **Performance y SEO** — reducir drásticamente el peso de JS e imágenes.
5. **Optimizado para edición por agentes de IA** (ver sección 4).

## 3. No-objetivos

- **No es un rediseño.** El look and feel se preserva: mismas fuentes, mismos colores, mismos copys, mismas imágenes.
- **No hay panel de CMS.** Decisión explícita del usuario (sección 4).
- **No hay autenticación de usuarios.** Es un sitio de marketing, no una aplicación.
- **No incluye la vista de leads en el OS.** Es un proyecto aparte (sección 11).

---

## 4. La decisión que define el proyecto: AI-first

El usuario editará el sitio **exclusivamente a través de agentes de IA**, no de un panel. Nadie que no pase por un agente necesita editar contenido.

Esto tiene dos consecuencias:

**No se construye CMS.** Un panel existe para que un humano evite tocar código. Aquí el humano *quiere* tocar código, vía agente. Construir el panel sería mantener una capa que nadie usa. El contenido vive como archivos Markdown en el repo, versionados en git.

**El código se estructura para que un agente trabaje bien sobre él.** Esto no es cosmético — determina la tasa de error de cada edición futura:

- **Archivos chicos y de propósito único.** Un `index.html` de 1031 líneas obliga a leerlo entero para cambiar una sección, y cada edición arriesga tocar lo vecino. Un `FAQ.astro` de ~40 líneas acota el radio de daño a esa sección.
- **Nombres que declaran intención.** `HeroSection`, `CaseStudyCard` — un agente en frío ubica el archivo correcto sin explorar.
- **Esquema tipado del contenido.** Un campo mal escrito rompe el build con nombre de archivo y campo. Sin esto, un typo llega a producción en silencio. Es la red de seguridad que hace confiable delegar contenido a agentes.
- **`CLAUDE.md` en la raíz** con las convenciones del repo.

---

## 5. Stack

**Astro**, sitio estático.

Evaluado contra Next.js y contra limpiar el HTML sin framework. Astro gana porque:

- Manda **cero JavaScript** al cliente por defecto — el objetivo de performance apunta directo ahí.
- Sus *content collections* son exactamente el modelo "archivos como CMS con esquema tipado".
- El sitio es de marketing y seguirá siéndolo (confirmado por el usuario). Next.js sería complejidad pagada por una app hipotética.

**Trade-off aceptado:** si en el futuro aparece una app con login, no vivirá aquí — irá en su propio subdominio y repo.

---

## 6. Estructura del repo

```
src/
  content/
    case-studies/          # el "CMS": un .md por caso
      <slug>.md
    config.ts              # esquema tipado (Zod) de las colecciones
  components/
    sections/              # una sección de página = un archivo
      Hero.astro
      LogoCloud.astro
      Testimonials.astro
      FAQ.astro
      CTA.astro
      ...
    ui/                    # piezas chicas reutilizables
      Button.astro
      CaseStudyCard.astro
      Accordion.astro
  layouts/
    Base.astro             # head, nav, footer — hoy duplicados en 8 archivos
  pages/
    index.astro
    services.astro
    contact.astro
    case-studies/
      index.astro          # listado, generado desde content/
      [slug].astro         # plantilla única de detalle
    404.astro
  styles/
    tokens.css             # variables CSS copiadas literal del sitio actual
    global.css
public/
  images/                  # solo los 38 originales
supabase/
  functions/
    submit-lead/           # Edge Function del formulario
CLAUDE.md                  # convenciones para agentes
```

### Páginas a migrar

| Actual | Nueva | Nota |
|---|---|---|
| `index.html` | `pages/index.astro` | 7 secciones: header, logos, layout239, layout538, testimonial, blog34, CTA, FAQ |
| `services.html` | `pages/services.astro` | 5 secciones |
| `case-studies-2.html` | `pages/case-studies/index.astro` | listado generado desde `content/` |
| `case-studies/case-study.html` | `pages/case-studies/[slug].astro` | plantilla única |
| `contact.html` | `pages/contact.astro` | + formulario funcional |
| `404.html` | `pages/404.astro` | |
| `401.html` | — | descartada, no aplica en hosting estático |
| `style-guide-*.html` | — | artefacto de Webflow, no es página pública |

---

## 7. Preservación del look and feel

### Tipografías — idénticas, mejor servidas

Oswald (títulos, pesos 200–700) e Inter (cuerpo, pesos 400/500) se mantienen. Cambia la entrega: se auto-alojan vía `@fontsource` y se precargan en el `<head>`. Mismo aspecto visual, sin request a Google, sin FOUT, sin dependencia de un servidor ajeno.

### Colores y escala — copiados literal

El bloque `:root` de `sebastians-fantabulous-site-974d51.webflow.css` pasa a `tokens.css` **sin modificar un solo valor**:

```css
--_typography---font-styles--heading: Oswald, sans-serif;
--_typography---font-styles--body: Inter;
--_primitives---colors--spring-green-2: #0f6;
--_primitives---colors--neutral-darkest: #0d0a00;
--_primitives---colors--white: #fff;
/* + color-scheme-1..5, opacidades, escalas */
```

Los nombres de token se conservan aunque sean verbosos: son la única fuente de verdad compartida con el diseño original.

### Copys — extraídos, no reescritos

Cada texto sale del HTML actual tal cual y entra al componente o al `.md` correspondiente. **No se reescribe copy** salvo pedido explícito del usuario.

### Imágenes — mismas fotos, ~85% menos peso

Se suben los **38 originales**; las **84 variantes** que Webflow generó a mano se descartan. El componente `<Image>` de Astro genera WebP/AVIF y el `srcset` responsive en build. Objetivo: de 24.18 MB a ~2–4 MB, visualmente idéntico.

### Verificación visual — obligatoria

"Mantener el look and feel" no puede quedar en palabra del agente. Procedimiento:

1. **Antes de tocar nada:** capturar screenshots de las 8 páginas actuales (desktop 1440px y móvil 390px) desde el servidor local. Esa es la referencia congelada.
2. **Al terminar cada página:** capturar la nueva y comparar lado a lado.
3. **Si hay diferencia:** corregirla, o señalarla explícitamente al usuario.
4. **Nunca declarar "quedó igual" sin haber mirado ambas imágenes.**

---

## 8. Captura de leads

### Decisión: tabla propia, no `clientes`

Los leads van a una tabla nueva `leads_web` en el proyecto Supabase **MagicHack_OS** (`ifzwkotwibylgbsxpggj`), no dentro de `clientes`.

Razón: `clientes` contiene 38 registros reales y curados. El formulario web es **entrada pública no confiable**. Escribir ahí exigiría abrir permisos de inserción a tráfico anónimo, lo que permitiría a cualquier bot inyectar basura en la tabla de clientes reales. Con tabla separada, el ruido queda en la sala de espera; el usuario califica y promueve a `clientes` de forma deliberada.

Encaja con el embudo ya modelado en el OS: **lead → propuesta → cliente → proyecto → facturación**.

Se sigue la convención de nombres en español del esquema existente (`clientes`, `proyectos`, `tareas`, `propuestas`).

### Esquema de `leads_web`

Campos derivados del formulario actual (`contact.html:540-576`):

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `nombre` | text NOT NULL | |
| `apellido` | text NOT NULL | |
| `email` | text NOT NULL | validado en la Edge Function |
| `telefono` | text | |
| `motivo` | text | del `<select>` "What brings you here?" |
| `tipo_empresa` | text | SaaS / fintech / e-commerce / B2B / consumo / otro |
| `mensaje` | text NOT NULL | máx. 5000 chars |
| `estado` | text | `nuevo` \| `contactado` \| `descartado` \| `convertido`. Default `nuevo` |
| `created_at` | timestamptz | default `now()` |

### Arquitectura: Edge Function como única puerta

```
Formulario (estático) → Edge Function → valida → INSERT leads_web → correo
```

**Descartada** la alternativa de que el navegador inserte directo en la tabla con la clave anónima. Ese diseño tiene un agujero: si el navegador puede insertar, cualquiera puede — un spammer le pega al endpoint con un script y **el campo trampa nunca se evalúa**, porque el envío jamás pasó por la página.

Con Edge Function, la tabla queda **cerrada al público**: el rol anónimo no puede insertar ni leer. Solo la función escribe, con credenciales de servidor que nunca salen al navegador.

El sitio sigue siendo estático — la Edge Function es serverless, no hay servidor que mantener, y el plan gratuito cubre de sobra un formulario de contacto.

### RLS

- Rol `anon`: **sin permisos** sobre `leads_web` (ni INSERT ni SELECT).
- Escritura: exclusivamente vía Edge Function con `service_role`.
- Lectura: solo autenticado (la consumirá la app del OS, proyecto aparte).

### Anti-spam — 5 capas

1. **Campo trampa (honeypot).** Input invisible por CSS. Humanos no lo ven; bots simples lo llenan. Si viene con contenido, se descarta. Costo cero, filtra el grueso del spam automatizado.
2. **Cloudflare Turnstile.** Alternativa moderna al CAPTCHA, **invisible** para el usuario real. Emite un token que la Edge Function verifica server-side antes de guardar. Gratis, sin límite práctico, no rastrea usuarios. Es la capa que detiene bots serios.
3. **Límite por IP.** Máximo **5 envíos por hora** desde la misma IP. Corta el envío masivo. (Un humano legítimo rara vez pasa de 1–2; 5 deja margen de sobra para reintentos por error.)
4. **Validación de contenido.** Formato de email, largo mín/máx del mensaje, campos obligatorios presentes, `tipo_empresa` dentro del enum válido.
5. **Campo `estado`.** Lo que se cuele se marca `descartado` sin borrar el registro.

### Notificación

Correo al insertar un lead, disparado desde la misma Edge Function. Servicio de envío: Resend (capa gratuita suficiente). Requiere API key en las variables de entorno de la función.

Justificación: una tabla que nadie abre no sirve — si el lead llega el martes y se ve el viernes, se perdió. El correo es lo que dispara la acción; la tabla es el registro.

---

## 9. Componentes interactivos

Inventario medido en el HTML actual y su reemplazo:

| Componente | Refs | Reemplazo | JS resultante |
|---|---|---|---|
| Slider / carrusel | 54 | `scroll-snap` CSS (por defecto, 0 JS). Se escala a Embla **solo si** el original tiene autoplay o flechas que `scroll-snap` no cubra — a decidir al observar el sitio actual, no antes | 0–5 KB |
| Dropdowns de nav | 43 | `<details>` nativo | 0 |
| Acordeón (FAQ) | 26 | `<details>` / `<summary>` nativo | 0 |
| Formularios | 58 | markup + estilos propios | 0 |
| Menú móvil | 5 | JS propio | ~20 líneas |
| Tabs | 6 | JS propio | ~30 líneas |
| Lightbox | 2 | `<dialog>` nativo | ~15 líneas |
| Interacciones `data-w-id` | 27 | CSS + Intersection Observer | ~1 KB |

**Resultado:** desaparecen `webflow.js` (686 KB) y jQuery (~90 KB). El reemplazo completo ronda 5–10 KB. Reducción ≈99%.

### Dos reemplazos son mejoras, no equivalencias

- **Acordeón → `<details>` nativo:** funciona sin JS, accesible por teclado y lector de pantalla por defecto, y Chrome permite que Ctrl+F encuentre texto dentro de secciones cerradas — hoy ese contenido está oculto al buscador del navegador.
- **Dropdowns → `<details>` nativo:** manejo correcto de foco y teclado, que las implementaciones a mano suelen romper.

---

## 10. Riesgos y limitaciones conocidas

**Las 27 interacciones `data-w-id` no son legibles desde el código.** Están definidas dentro de `webflow.js`, 686 KB en una sola línea minificada.

Plan: con el sitio actual corriendo en local, observar cada elemento animado y registrar su comportamiento (tipo de animación, disparador, duración aproximada), luego replicar en CSS y comparar contra el original.

**Limitación aceptada:** las curvas de easing exactas de Webflow no son observables a simple vista. Es probable que alguna animación quede ligeramente distinta. Cuando ocurra, **se señala explícitamente al usuario en vez de darla por equivalente.**

**Sin control de versiones.** La carpeta no es un repositorio git. Debe inicializarse **antes** de empezar a editar, para tener capacidad de deshacer.

---

## 11. Fuera de alcance — Proyecto 2

**Vista de leads en el OS.** Vive en otro repositorio: `github.com/SebasMagic/MagicHack_OS_PM`. Tendrá su propio spec.

Razón de la separación: son dos ciclos distintos (reconstruir un sitio de marketing vs. agregar una pantalla a una app existente) y solo comparten la tabla `leads_web`. Juntarlos ataría el lanzamiento del sitio a que la pantalla del OS esté lista, sin ningún beneficio.

Este orden además permite que el proyecto 2 se construya sobre una tabla con datos reales entrando, no sobre un diseño en papel.

Mientras tanto los leads se ven en el Table Editor de Supabase y llegan por correo — no hay ceguera en ningún momento.

---

## 12. Criterios de aceptación

1. Las 6 páginas públicas renderizan y son visualmente equivalentes al original en desktop y móvil, **verificado por comparación de screenshots**.
2. Oswald e Inter se auto-alojan y cargan sin FOUT.
3. Los valores de `tokens.css` son idénticos a los del CSS original.
4. Agregar un case study = crear un archivo `.md`; su página de detalle y su tarjeta en el listado se generan solas.
5. Un campo inválido en un `.md` **rompe el build** indicando archivo y campo.
6. El formulario escribe en `leads_web` y dispara el correo.
7. El rol `anon` no puede leer ni escribir `leads_web` (verificado con una consulta directa).
8. Un envío con el honeypot lleno se descarta sin escribir.
9. `webflow.js` y jQuery ya no se cargan; el JS de cliente queda bajo 15 KB.
10. Las imágenes se sirven en WebP/AVIF con `srcset`; peso total bajo 5 MB.
11. `CLAUDE.md` documenta las convenciones del repo.
