# Rebuild del sitio MagicHack — Plan de Implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar tarea por tarea. Los pasos usan checkbox (`- [ ]`) para seguimiento.

**Goal:** Reconstruir el sitio de marketing de MagicHack en Astro preservando el look and feel exacto, con contenido en archivos, formulario funcional que captura leads en Supabase, y ~99% menos JavaScript.

**Architecture:** Astro estático. El contenido de case studies vive como Markdown con esquema tipado (content collections). El formulario postea a una Edge Function de Supabase que valida, filtra spam, inserta en `leads_web` y notifica por correo. Los tokens de diseño se copian literal del CSS de Webflow.

**Tech Stack:** Astro 5, TypeScript, Playwright (visual + E2E), Vitest, Supabase (Postgres + Edge Functions/Deno), Cloudflare Turnstile, Resend.

**Spec:** [`docs/superpowers/specs/2026-07-20-rebuild-sitio-magichack-design.md`](../specs/2026-07-20-rebuild-sitio-magichack-design.md)

## Global Constraints

- **No se reescribe copy.** Todo texto se extrae literal del HTML actual. Cualquier cambio de wording requiere pedido explícito del usuario.
- **Los valores de token no se modifican.** `tokens.css` replica los valores del `:root` original byte por byte. Los nombres verbosos (`--_primitives---colors--spring-green-2`) se conservan.
- **Fuentes:** Oswald (títulos, 200–700) e Inter (cuerpo, 400/500). Auto-alojadas, precargadas en `<head>`.
- **Nunca declarar equivalencia visual sin comparar screenshots.** Si una diferencia no se puede corregir, se reporta explícitamente al usuario.
- **JS de cliente total < 15 KB.** `webflow.js` y jQuery no se cargan bajo ninguna circunstancia.
- **Convención de nombres en BD: español**, para coincidir con el esquema existente de MagicHack_OS (`clientes`, `proyectos`, `tareas`).
- **Proyecto Supabase:** MagicHack_OS, ref `ifzwkotwibylgbsxpggj`.
- **Secretos nunca en el repo.** `.env` está en `.gitignore`. Las claves de servicio viven solo en las variables de entorno de la Edge Function.
- **Commit al final de cada tarea.**

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `astro.config.mjs` | Configuración de Astro e integraciones |
| `src/styles/tokens.css` | Variables CSS copiadas del original — única fuente de verdad visual |
| `src/styles/global.css` | Reset, tipografía base, utilidades de layout |
| `src/layouts/Base.astro` | `<head>`, precarga de fuentes, meta tags, nav, footer |
| `src/components/nav/SiteNav.astro` | Navegación + menú móvil |
| `src/components/nav/SiteFooter.astro` | Footer |
| `src/components/ui/*.astro` | Piezas reutilizables (Button, Accordion, CaseStudyCard, Carousel) |
| `src/components/sections/*.astro` | Una sección de página = un archivo |
| `src/content.config.ts` | Esquema tipado de las colecciones |
| `src/content/case-studies/*.md` | Contenido editable |
| `src/pages/*.astro` | Rutas |
| `supabase/migrations/*.sql` | Esquema de BD versionado |
| `supabase/functions/submit-lead/index.ts` | Validación, anti-spam, insert, correo |
| `tests/visual/*.spec.ts` | Comparación contra baseline |
| `tests/e2e/*.spec.ts` | Flujos de usuario |
| `CLAUDE.md` | Convenciones del repo para agentes |

---

## Task 1: Congelar el baseline visual

Captura la referencia del sitio actual **antes de tocar nada**. Sin esto no hay forma de probar que el rebuild preservó el diseño.

**Files:**
- Create: `package.json`
- Create: `playwright.config.ts`
- Create: `scripts/capture-baseline.ts`
- Create: `baseline/` (salida, versionada)

**Interfaces:**
- Consumes: nada
- Produces: `baseline/<pagina>-<viewport>.png` — 12 archivos PNG que las tareas 3–10 usan como referencia

- [ ] **Step 1: Inicializar package.json**

```bash
npm init -y
npm pkg set name="magichack-web" version="0.1.0" type="module" private=true
```

- [ ] **Step 2: Instalar Playwright**

```bash
npm install -D @playwright/test tsx
npx playwright install chromium
```

- [ ] **Step 3: Escribir el script de captura**

Create `scripts/capture-baseline.ts`:

```typescript
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const PAGES = [
  { name: 'index', path: '/index.html' },
  { name: 'services', path: '/services.html' },
  { name: 'case-studies', path: '/case-studies-2.html' },
  { name: 'case-study', path: '/case-studies/case-study.html' },
  { name: 'contact', path: '/contact.html' },
  { name: '404', path: '/404.html' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const BASE = process.env.BASE_URL ?? 'http://localhost:8080';

async function main() {
  mkdirSync('baseline', { recursive: true });
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();

    for (const p of PAGES) {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
      // Las animaciones de scroll de Webflow necesitan que la pagina se recorra
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let y = 0;
          const step = () => {
            window.scrollTo(0, y);
            y += 400;
            if (y < document.body.scrollHeight) requestAnimationFrame(step);
            else { window.scrollTo(0, 0); resolve(); }
          };
          step();
        });
      });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: `baseline/${p.name}-${vp.name}.png`,
        fullPage: true,
      });
      console.log(`OK ${p.name}-${vp.name}`);
    }
    await ctx.close();
  }
  await browser.close();
}

main();
```

- [ ] **Step 4: Levantar el sitio actual y capturar**

```bash
python -m http.server 8080 &
npx tsx scripts/capture-baseline.ts
```

Expected: 12 líneas `OK <pagina>-<viewport>`, y 12 archivos en `baseline/`.

- [ ] **Step 5: Verificar que los screenshots no estén en blanco**

```bash
ls -la baseline/
```

Expected: cada PNG pesa más de 50 KB. Un archivo de pocos KB significa página en blanco — investigar antes de seguir.

**Abrir `baseline/index-desktop.png` y mirarlo.** Debe verse el sitio completo renderizado. Este paso no es opcional: un baseline roto invalida toda la verificación posterior.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/ baseline/
git commit -m "test: congelar baseline visual del sitio Webflow

12 screenshots (6 paginas x desktop/movil) como referencia
para verificar que el rebuild preserva el diseno."
```

---

## Task 2: Scaffold de Astro, tokens y layout base

Deja el proyecto compilando con las fuentes y colores correctos, nav y footer únicos.

**Files:**
- Create: `astro.config.mjs`, `tsconfig.json`
- Create: `src/styles/tokens.css`, `src/styles/global.css`
- Create: `src/layouts/Base.astro`
- Create: `src/components/nav/SiteNav.astro`, `src/components/nav/SiteFooter.astro`
- Create: `src/pages/index.astro` (placeholder temporal)
- Create: `tests/tokens.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nada
- Produces:
  - `Base.astro` con props `{ title: string; description?: string; ogImage?: string }`
  - `tokens.css` cargado globalmente — todas las secciones consumen `var(--...)`
  - Slot por defecto donde las páginas insertan su contenido

- [ ] **Step 1: Instalar Astro**

```bash
npm install astro
npm install @fontsource-variable/oswald @fontsource-variable/inter
npm install -D vitest
```

- [ ] **Step 2: Crear la config de Astro**

Create `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://themagichack.com',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
  image: { formats: ['avif', 'webp'] },
});
```

Create `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 3: Escribir el test de paridad de tokens**

Este test es la garantía mecánica de que no se alteró ningún color. Create `tests/tokens.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

function parseTokens(css: string): Record<string, string> {
  const root = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!root) throw new Error('No se encontro bloque :root');
  const out: Record<string, string> = {};
  for (const line of root[1].split(';')) {
    const m = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

describe('paridad de tokens con el CSS original de Webflow', () => {
  const original = parseTokens(
    readFileSync('css/sebastians-fantabulous-site-974d51.webflow.css', 'utf8')
  );
  const nuevo = parseTokens(readFileSync('src/styles/tokens.css', 'utf8'));

  it('no pierde ningun token', () => {
    const faltantes = Object.keys(original).filter((k) => !(k in nuevo));
    expect(faltantes).toEqual([]);
  });

  it('conserva todos los valores identicos', () => {
    const distintos = Object.keys(original)
      .filter((k) => k in nuevo && original[k] !== nuevo[k])
      .map((k) => `${k}: "${original[k]}" -> "${nuevo[k]}"`);
    expect(distintos).toEqual([]);
  });

  it('define las dos familias tipograficas esperadas', () => {
    expect(nuevo['--_typography---font-styles--heading']).toContain('Oswald');
    expect(nuevo['--_typography---font-styles--body']).toContain('Inter');
  });
});
```

- [ ] **Step 4: Correr el test y verificar que falla**

```bash
npx vitest run tests/tokens.test.ts
```

Expected: FAIL — `ENOENT: no such file or directory, open 'src/styles/tokens.css'`

- [ ] **Step 5: Generar tokens.css desde el original**

Extraer el bloque `:root` completo de `css/sebastians-fantabulous-site-974d51.webflow.css` (empieza en la línea 1) y copiarlo tal cual a `src/styles/tokens.css`.

**No editar ningún valor.** Estructura resultante:

```css
/* Tokens de diseno copiados literal del export de Webflow.
   NO MODIFICAR VALORES - tests/tokens.test.ts falla si cambian.
   Para cambiar un color hay que actualizar tambien el test. */
:root {
  --color-scheme-1--background: var(--_primitives---colors--white);
  --_typography---font-styles--body: 'Inter Variable', Inter, sans-serif;
  --color-scheme-1--text: var(--_primitives---colors--neutral-darkest);
  --_typography---font-styles--heading: 'Oswald Variable', Oswald, sans-serif;
  --_primitives---colors--neutral-darkest: #0d0a00;
  /* ... resto del bloque :root original, sin alterar ... */
}
```

Nota: las dos líneas de fuente son la única excepción permitida — se antepone la variante variable auto-alojada, conservando la familia original como fallback. El test valida con `toContain`, no igualdad exacta, para permitirlo.

- [ ] **Step 6: Correr el test y verificar que pasa**

```bash
npx vitest run tests/tokens.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 7: Crear global.css**

Create `src/styles/global.css`:

```css
@import '@fontsource-variable/oswald';
@import '@fontsource-variable/inter';
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }

html { -webkit-text-size-adjust: 100%; }

body {
  font-family: var(--_typography---font-styles--body);
  color: var(--color-scheme-1--text);
  background: var(--color-scheme-1--background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--_typography---font-styles--heading);
  line-height: 1.2;
  text-wrap: balance;
}

img, picture, svg, video { display: block; max-width: 100%; }

a { color: inherit; text-decoration: inherit; }

button, input, select, textarea { font: inherit; color: inherit; }

:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 0.125rem solid #4d65ff;
  outline-offset: 0.125rem;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 8: Crear el layout base**

Create `src/layouts/Base.astro`:

```astro
---
import '../styles/global.css';
import SiteNav from '../components/nav/SiteNav.astro';
import SiteFooter from '../components/nav/SiteFooter.astro';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const {
  title,
  description = 'MagicHack — growth marketing para empresas de tecnologia.',
  ogImage = '/images/og-default.png',
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />

    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL(ogImage, Astro.site)} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />

    <link rel="icon" href="/images/favicon.png" />
    <link rel="apple-touch-icon" href="/images/webclip.png" />
  </head>
  <body>
    <SiteNav />
    <main>
      <slot />
    </main>
    <SiteFooter />
  </body>
</html>
```

- [ ] **Step 9: Extraer nav y footer del HTML actual**

Copiar el markup del `<nav>` de `index.html` a `src/components/nav/SiteNav.astro` y el del `<footer>` a `src/components/nav/SiteFooter.astro`. Traducir clases de Webflow a CSS propio con `<style>` scoped, usando los tokens.

El menú móvil va con este JS (reemplaza `w-nav-button`, ~20 líneas):

```astro
<script>
  const btn = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-nav-menu]');

  btn?.addEventListener('click', () => {
    const abierto = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!abierto));
    menu?.toggleAttribute('data-open', !abierto);
    document.body.style.overflow = abierto ? '' : 'hidden';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn?.getAttribute('aria-expanded') === 'true') {
      btn.click();
      btn.focus();
    }
  });
</script>
```

- [ ] **Step 10: Placeholder de home y verificar el build**

Create `src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="TheMagicHack">
  <h1>Placeholder</h1>
</Base>
```

Añadir scripts a `package.json`:

```bash
npm pkg set scripts.dev="astro dev" scripts.build="astro build" scripts.preview="astro preview" scripts.test="vitest run"
```

```bash
npm run build
```

Expected: build exitoso, `dist/index.html` generado.

- [ ] **Step 11: Verificar que las fuentes cargan sin request externo**

```bash
npm run dev
```

Abrir `http://localhost:4321`, DevTools → Network → filtrar por "font". Expected: los archivos de fuente vienen de `localhost`, **cero requests a `fonts.googleapis.com` o `fonts.gstatic.com`**.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro con tokens, fuentes auto-alojadas y layout base

- tokens.css copiado literal del CSS de Webflow, con test de paridad
- Oswald e Inter auto-alojadas via fontsource (sin requests a Google)
- Base.astro unifica head/nav/footer, hoy duplicados en 8 archivos
- menu movil en ~20 lineas de JS, reemplaza w-nav-button"
```

---

## Task 3: Componentes UI reutilizables

Las piezas que varias páginas comparten. Se construyen una vez, antes de las páginas que las consumen.

**Files:**
- Create: `src/components/ui/Button.astro`
- Create: `src/components/ui/Accordion.astro`
- Create: `src/components/ui/Carousel.astro`
- Create: `tests/e2e/componentes.spec.ts`

**Interfaces:**
- Consumes: tokens de Task 2
- Produces:
  - `Button` — props `{ href?: string; variant?: 'primary' | 'alternate' | 'link'; type?: 'button' | 'submit' }`
  - `Accordion` — props `{ items: Array<{ pregunta: string; respuesta: string }> }`
  - `Carousel` — slot con los ítems; navegación por `scroll-snap`

- [ ] **Step 1: Escribir los tests E2E de los componentes**

`playwright.config.ts` ya existe desde Task 1 — **modificarlo**, no crearlo. Añadirle el bloque `webServer` que se muestra abajo, conservando lo que ya tiene.

Create `tests/e2e/componentes.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Acordeon del FAQ', () => {
  test('abre y cierra sin JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');

    const primero = page.locator('details').first();
    await expect(primero).not.toHaveAttribute('open', '');
    await primero.locator('summary').click();
    await expect(primero).toHaveAttribute('open', '');
    await ctx.close();
  });

  test('es operable con teclado', async ({ page }) => {
    await page.goto('/');
    const primero = page.locator('details').first();
    await primero.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(primero).toHaveAttribute('open', '');
  });
});

test.describe('Menu movil', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('abre, cierra y responde a Escape', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('[data-nav-toggle]');
    const menu = page.locator('[data-nav-menu]');

    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Presupuesto de JavaScript', () => {
  test('no carga webflow.js ni jQuery, y se mantiene bajo 15 KB', async ({ page }) => {
    const scripts: { url: string; size: number }[] = [];

    page.on('response', async (res) => {
      if (res.request().resourceType() === 'script') {
        const body = await res.body().catch(() => Buffer.alloc(0));
        scripts.push({ url: res.url(), size: body.length });
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const prohibidos = scripts.filter((s) => /webflow|jquery/i.test(s.url));
    expect(prohibidos, `scripts prohibidos: ${prohibidos.map(s => s.url).join(', ')}`).toEqual([]);

    const total = scripts.reduce((a, s) => a + s.size, 0);
    expect(total, `JS total: ${(total / 1024).toFixed(1)} KB`).toBeLessThan(15 * 1024);
  });
});
```

Modify `playwright.config.ts` (creado en Task 1) para que quede así:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

```bash
npx playwright test tests/e2e/componentes.spec.ts
```

Expected: FAIL — no existen `details` ni `[data-nav-toggle]` en la home placeholder.

- [ ] **Step 3: Implementar Button**

Create `src/components/ui/Button.astro`:

```astro
---
interface Props {
  href?: string;
  variant?: 'primary' | 'alternate' | 'link';
  type?: 'button' | 'submit';
  class?: string;
}
const { href, variant = 'primary', type = 'button', class: cls } = Astro.props;
const Tag = href ? 'a' : 'button';
---
<Tag
  class:list={['btn', `btn--${variant}`, cls]}
  href={href}
  type={href ? undefined : type}
>
  <slot />
</Tag>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: 1px solid transparent;
    font-family: var(--_typography---font-styles--body);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  .btn--primary {
    background: var(--color-scheme-1--accent);
    color: var(--color-scheme-1--background);
  }
  .btn--alternate {
    background: var(--_primitives---colors--spring-green-2);
    color: var(--_primitives---colors--neutral-darkest);
  }
  .btn--alternate:hover { background: var(--_primitives---colors--spring-green-dark-2); }
  .btn--link { background: transparent; padding-inline: 0; text-decoration: underline; }
</style>
```

- [ ] **Step 4: Implementar Accordion con `<details>` nativo**

Create `src/components/ui/Accordion.astro`:

```astro
---
interface Props {
  items: Array<{ pregunta: string; respuesta: string }>;
}
const { items } = Astro.props;
---
<div class="accordion">
  {items.map((item) => (
    <details class="accordion__item">
      <summary class="accordion__q">
        <span>{item.pregunta}</span>
        <svg class="accordion__icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </summary>
      <div class="accordion__a"><p>{item.respuesta}</p></div>
    </details>
  ))}
</div>

<style>
  .accordion__item { border-bottom: 1px solid var(--color-scheme-1--border); }
  .accordion__q {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 0;
    cursor: pointer;
    font-family: var(--_typography---font-styles--heading);
    list-style: none;
  }
  .accordion__q::-webkit-details-marker { display: none; }
  .accordion__icon { flex: none; transition: transform 0.2s ease; }
  details[open] .accordion__icon { transform: rotate(180deg); }
  .accordion__a { padding-bottom: 1.25rem; }
</style>
```

Cero JavaScript. Accesible por defecto, y Ctrl+F encuentra el texto cerrado.

- [ ] **Step 5: Implementar Carousel con scroll-snap**

Create `src/components/ui/Carousel.astro`:

```astro
---
interface Props { label: string; }
const { label } = Astro.props;
---
<div class="carousel" role="region" aria-label={label} tabindex="0">
  <div class="carousel__track"><slot /></div>
</div>

<style>
  .carousel { overflow-x: auto; scrollbar-width: none; }
  .carousel::-webkit-scrollbar { display: none; }
  .carousel__track {
    display: flex;
    gap: 1.5rem;
    scroll-snap-type: x mandatory;
    overflow-x: auto;
    scroll-behavior: smooth;
  }
  .carousel__track > :global(*) {
    scroll-snap-align: start;
    flex: 0 0 min(100%, 24rem);
  }
</style>
```

Cero JavaScript. Arrastre táctil nativo en móvil, rueda y teclado en desktop.

**Decisión pendiente de observación:** si el carrusel original tiene autoplay o flechas que `scroll-snap` no cubre, escalar a Embla (~5 KB). Verificar mirando el sitio en `localhost:8080` **antes** de decidir — no asumir.

- [ ] **Step 6: Correr los tests y verificar que pasan**

Requiere que la home ya use los componentes — se completa en Task 4. Por ahora:

```bash
npx playwright test tests/e2e/componentes.spec.ts --grep "JavaScript"
```

Expected: PASS — el test de presupuesto de JS ya debe pasar con la home placeholder.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: componentes UI base (Button, Accordion, Carousel)

Accordion y Carousel con cero JS usando <details> y scroll-snap.
Incluye test que falla si vuelve a aparecer webflow.js o jQuery,
o si el JS de cliente supera 15 KB."
```

---

## Task 4: Home

**Files:**
- Create: `src/components/sections/Hero.astro`, `LogoCloud.astro`, `Layout239.astro`, `Layout538.astro`, `Testimonials.astro`, `BlogTeaser.astro`, `CTA.astro`, `FAQ.astro`
- Modify: `src/pages/index.astro`
- Create: `tests/visual/paginas.spec.ts`

**Interfaces:**
- Consumes: `Base` (T2), `Button`/`Accordion`/`Carousel` (T3)
- Produces: patrón de sección que las tareas 5–7 replican — cada sección es un `.astro` autónomo con su `<style>` scoped, sin props salvo que el contenido se repita

- [ ] **Step 1: Escribir el test de regresión visual**

**Qué prueba este test y qué no.** No compara contra `baseline/` (el sitio Webflow): dos implementaciones distintas del mismo diseño nunca coinciden a nivel de píxel, y un test así fallaría siempre y se acabaría ignorando. La paridad con Webflow se verifica **a ojo**, en el Step 5, y ese es el gate real.

Lo que sí hace: fija un snapshot del sitio nuevo y falla si un cambio posterior lo rompe. Es un guardia de regresión hacia adelante, no una prueba de equivalencia con Webflow.

Create `tests/visual/paginas.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const PAGINAS = [
  { nombre: 'index', ruta: '/' },
  { nombre: 'services', ruta: '/services' },
  { nombre: 'case-studies', ruta: '/case-studies' },
  { nombre: 'contact', ruta: '/contact' },
];

const VIEWPORTS = [
  { nombre: 'desktop', width: 1440, height: 900 },
  { nombre: 'mobile', width: 390, height: 844 },
];

for (const p of PAGINAS) {
  for (const vp of VIEWPORTS) {
    test(`${p.nombre} @ ${vp.nombre} coincide con el baseline`, async ({ page }, testInfo) => {
      const baseline = `baseline/${p.nombre}-${vp.nombre}.png`;
      test.skip(!existsSync(baseline), `Falta baseline: ${baseline}`);

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(p.ruta, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      const actual = await page.screenshot({ fullPage: true });
      await testInfo.attach(`actual-${p.nombre}-${vp.nombre}`, {
        body: actual,
        contentType: 'image/png',
      });

      // El baseline viene de un DOM distinto: se compara con tolerancia alta.
      // Su valor es detectar roturas grandes (secciones faltantes, layout roto),
      // no diferencias de subpixel. La revision humana lado a lado es el juez final.
      expect(actual).toMatchSnapshot(`${p.nombre}-${vp.nombre}.png`, {
        maxDiffPixelRatio: 0.15,
      });
    });
  }
}
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
npx playwright test tests/visual/paginas.spec.ts
```

Expected: FAIL — la home es un placeholder; las rutas `/services`, `/case-studies`, `/contact` dan 404.

- [ ] **Step 3: Extraer las secciones del index.html actual**

De `index.html` salen 8 secciones, en este orden. Para cada una: copiar el markup y **el copy literal**, traducir clases Webflow a CSS scoped con tokens.

| Archivo | Origen | Contenido |
|---|---|---|
| `Hero.astro` | `.section_header36` | h1 + subtítulo + CTAs |
| `LogoCloud.astro` | `.section_logo3` | h6 + logos de clientes |
| `Layout239.astro` | `.section_layout239` | h2 + grid de 3 columnas |
| `Layout538.astro` | `.section_layout538` | h2 + texto + imagen |
| `Testimonials.astro` | `.section_testimonial14` | carrusel de testimonios |
| `BlogTeaser.astro` | `.section_blog34` | h2 + tarjetas |
| `CTA.astro` | `.section_cta65` | h2 + botón |
| `FAQ.astro` | `.section_faq10` | h2 + acordeón |

Patrón de cada sección:

```astro
---
// src/components/sections/Hero.astro
import Button from '../ui/Button.astro';
---
<section class="hero">
  <div class="container">
    <h1>{/* copy literal de index.html */}</h1>
    <p>{/* copy literal */}</p>
    <div class="hero__acciones">
      <Button href="/contact" variant="alternate">Initiate sequence</Button>
    </div>
  </div>
</section>

<style>
  .hero { padding-block: 6rem; background: var(--color-scheme-1--background); }
  .container { max-width: 80rem; margin-inline: auto; padding-inline: 1.5rem; }
</style>
```

`FAQ.astro` alimenta el `Accordion` de T3 con un array local — las preguntas salen literales del HTML actual.

- [ ] **Step 4: Componer la home**

Modify `src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/sections/Hero.astro';
import LogoCloud from '../components/sections/LogoCloud.astro';
import Layout239 from '../components/sections/Layout239.astro';
import Layout538 from '../components/sections/Layout538.astro';
import Testimonials from '../components/sections/Testimonials.astro';
import BlogTeaser from '../components/sections/BlogTeaser.astro';
import CTA from '../components/sections/CTA.astro';
import FAQ from '../components/sections/FAQ.astro';
---
<Base title="TheMagicHack">
  <Hero />
  <LogoCloud />
  <Layout239 />
  <Layout538 />
  <Testimonials />
  <BlogTeaser />
  <CTA />
  <FAQ />
</Base>
```

- [ ] **Step 5: Comparación visual manual — paso obligatorio**

```bash
npm run build && npm run preview
```

Abrir lado a lado:
- Original: `http://localhost:8080/index.html`
- Nuevo: `http://localhost:4321/`

Recorrer ambos a 1440px y a 390px. Revisar: tamaños tipográficos, espaciado entre secciones, colores, alineación, orden de secciones.

**Mirar las imágenes. No declarar equivalencia sin haberlo hecho.** Anotar cualquier diferencia que no se logre corregir para reportarla al usuario.

- [ ] **Step 6: Correr los tests visuales**

```bash
npx playwright test tests/visual/paginas.spec.ts --grep index --update-snapshots
npx playwright test tests/e2e/componentes.spec.ts
```

Expected: los tests de componentes pasan (acordeón, menú móvil, presupuesto de JS).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: home reconstruida en 8 secciones

Cada seccion es un componente autonomo, reemplazando las 1031
lineas de index.html. Copy e imagenes literales del original."
```

---

## Task 5: Página de servicios

**Files:**
- Create: `src/components/sections/services/*.astro` (5 secciones)
- Create: `src/pages/services.astro`

**Interfaces:**
- Consumes: `Base` (T2), componentes UI (T3), patrón de sección (T4)
- Produces: ruta `/services`

- [ ] **Step 1: Extraer las 5 secciones de services.html**

`services.html` tiene un `h1` y cinco `h2`. Crear un componente por sección en `src/components/sections/services/`, siguiendo el patrón de T4. Copy e imágenes literales.

- [ ] **Step 2: Componer la página**

Create `src/pages/services.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import ServicesHero from '../components/sections/services/ServicesHero.astro';
import ServicesList from '../components/sections/services/ServicesList.astro';
import ServicesProcess from '../components/sections/services/ServicesProcess.astro';
import ServicesResults from '../components/sections/services/ServicesResults.astro';
import ServicesCTA from '../components/sections/services/ServicesCTA.astro';
---
<Base title="Services | TheMagicHack">
  <ServicesHero />
  <ServicesList />
  <ServicesProcess />
  <ServicesResults />
  <ServicesCTA />
</Base>
```

Los nombres de componente son provisionales: ajustarlos al contenido real de cada sección al extraerla.

- [ ] **Step 3: Verificar el link del nav**

```bash
npm run build && npm run preview
```

Navegar a `http://localhost:4321/services` desde el menú. Expected: carga sin 404, el link activo se marca.

- [ ] **Step 4: Comparación visual lado a lado**

Original `http://localhost:8080/services.html` vs nuevo `/services`, a 1440px y 390px. **Mirar ambas.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: pagina de servicios reconstruida"
```

---

## Task 6: Case studies — colección, listado y detalle

El corazón del "CMS": esquema tipado, plantilla única, y el listado generado.

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/case-studies/<slug>.md` (uno por caso existente)
- Create: `src/components/ui/CaseStudyCard.astro`
- Create: `src/pages/case-studies/index.astro`, `src/pages/case-studies/[slug].astro`
- Create: `tests/content.test.ts`

**Interfaces:**
- Consumes: `Base` (T2), componentes UI (T3)
- Produces:
  - Colección `case-studies` con el esquema de abajo
  - `CaseStudyCard` — props `{ entry: CollectionEntry<'case-studies'> }`
  - Rutas `/case-studies` y `/case-studies/<slug>`

- [ ] **Step 1: Definir el esquema tipado**

Create `src/content.config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      cliente: z.string().min(1),
      titulo: z.string().min(1),
      resumen: z.string().min(1).max(300),
      resultado: z.string().min(1),
      industria: z.enum(['saas', 'fintech', 'ecommerce', 'b2b', 'consumo', 'otro']),
      imagen: image(),
      imagenAlt: z.string().min(1),
      orden: z.number().default(0),
      publicado: z.boolean().default(true),
    }),
});

export const collections = { 'case-studies': caseStudies };
```

Esto es la red de seguridad: un campo mal escrito u omitido rompe el build con nombre de archivo y campo.

- [ ] **Step 2: Escribir el test del esquema**

Create `tests/content.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

const DIR = 'src/content/case-studies';
const OBLIGATORIOS = ['cliente', 'titulo', 'resumen', 'resultado', 'industria', 'imagen', 'imagenAlt'];
const INDUSTRIAS = ['saas', 'fintech', 'ecommerce', 'b2b', 'consumo', 'otro'];

function frontmatter(archivo: string): Record<string, string> {
  const texto = readFileSync(`${DIR}/${archivo}`, 'utf8');
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error(`${archivo} no tiene frontmatter`);
  const out: Record<string, string> = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const kv = linea.match(/^(\w+):\s*(.+)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

describe('contenido de case studies', () => {
  const archivos = readdirSync(DIR).filter((f) => f.endsWith('.md'));

  it('existe al menos un case study', () => {
    expect(archivos.length).toBeGreaterThan(0);
  });

  it.each(archivos)('%s tiene todos los campos obligatorios', (archivo) => {
    const fm = frontmatter(archivo);
    const faltantes = OBLIGATORIOS.filter((c) => !(c in fm));
    expect(faltantes, `faltan en ${archivo}`).toEqual([]);
  });

  it.each(archivos)('%s usa una industria valida', (archivo) => {
    expect(INDUSTRIAS).toContain(frontmatter(archivo).industria);
  });
});
```

- [ ] **Step 3: Correr y verificar que falla**

```bash
npx vitest run tests/content.test.ts
```

Expected: FAIL — `ENOENT: src/content/case-studies`

- [ ] **Step 4: Migrar el case study existente a Markdown**

Del contenido de `case-studies/case-study.html` y de las tarjetas de `case-studies-2.html`, crear un `.md` por caso:

```markdown
---
cliente: "Nombre del cliente"
titulo: "Titulo del caso, literal del HTML"
resumen: "Resumen corto, literal del HTML"
resultado: "+240% en leads calificados"
industria: "saas"
imagen: "../../assets/case-studies/<archivo>.png"
imagenAlt: "Descripcion de la imagen"
orden: 1
publicado: true
---

El cuerpo del case study en Markdown, con el texto literal
extraido del HTML original.

## Subtitulos si el original los tiene

Parrafos siguientes.
```

Mover las imágenes de case studies a `src/assets/case-studies/` para que Astro las optimice (`public/` no se optimiza).

- [ ] **Step 5: Correr el test y verificar que pasa**

```bash
npx vitest run tests/content.test.ts
```

Expected: PASS

- [ ] **Step 6: Implementar la tarjeta**

Create `src/components/ui/CaseStudyCard.astro`:

```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

interface Props { entry: CollectionEntry<'case-studies'>; }
const { entry } = Astro.props;
const { cliente, titulo, resumen, resultado, imagen, imagenAlt } = entry.data;
---
<a class="card" href={`/case-studies/${entry.id}`}>
  <Image src={imagen} alt={imagenAlt} widths={[400, 800]} sizes="(max-width: 768px) 100vw, 400px" />
  <div class="card__cuerpo">
    <p class="card__cliente">{cliente}</p>
    <h3 class="card__titulo">{titulo}</h3>
    <p class="card__resumen">{resumen}</p>
    <p class="card__resultado">{resultado}</p>
  </div>
</a>

<style>
  .card { display: block; border: 1px solid var(--color-scheme-1--border); transition: border-color 0.2s ease; }
  .card:hover { border-color: var(--_primitives---colors--spring-green-2); }
  .card__cuerpo { padding: 1.5rem; }
  .card__cliente { font-size: 0.875rem; opacity: 0.6; }
  .card__titulo { font-family: var(--_typography---font-styles--heading); margin-block: 0.5rem; }
  .card__resultado { color: var(--_primitives---colors--spring-green-dark-2); font-weight: 500; margin-top: 1rem; }
</style>
```

- [ ] **Step 7: Implementar el listado**

Create `src/pages/case-studies/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import CaseStudyCard from '../../components/ui/CaseStudyCard.astro';

const casos = (await getCollection('case-studies', ({ data }) => data.publicado))
  .sort((a, b) => a.data.orden - b.data.orden);
---
<Base title="Case Studies | TheMagicHack">
  <section class="listado">
    <div class="container">
      <h1>{/* copy literal del h1 de case-studies-2.html */}</h1>
      <div class="listado__grid">
        {casos.map((entry) => <CaseStudyCard entry={entry} />)}
      </div>
    </div>
  </section>
</Base>

<style>
  .listado { padding-block: 5rem; }
  .container { max-width: 80rem; margin-inline: auto; padding-inline: 1.5rem; }
  .listado__grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    margin-top: 3rem;
  }
</style>
```

- [ ] **Step 8: Implementar la plantilla de detalle**

Create `src/pages/case-studies/[slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import { Image } from 'astro:assets';
import Base from '../../layouts/Base.astro';
import CTA from '../../components/sections/CTA.astro';

export async function getStaticPaths() {
  const casos = await getCollection('case-studies', ({ data }) => data.publicado);
  return casos.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const { cliente, titulo, resumen, resultado, imagen, imagenAlt } = entry.data;
---
<Base title={`${titulo} | TheMagicHack`} description={resumen}>
  <article class="caso">
    <header class="caso__header container">
      <p class="caso__cliente">{cliente}</p>
      <h1>{titulo}</h1>
      <p class="caso__resultado">{resultado}</p>
    </header>
    <Image class="caso__hero" src={imagen} alt={imagenAlt} widths={[800, 1600]} sizes="100vw" />
    <div class="caso__cuerpo container">
      <Content />
    </div>
  </article>
  <CTA />
</Base>

<style>
  .container { max-width: 48rem; margin-inline: auto; padding-inline: 1.5rem; }
  .caso__header { padding-block: 4rem 2rem; }
  .caso__cliente { opacity: 0.6; }
  .caso__resultado {
    color: var(--_primitives---colors--spring-green-dark-2);
    font-family: var(--_typography---font-styles--heading);
    font-size: 1.5rem;
    margin-top: 1rem;
  }
  .caso__hero { width: 100%; height: auto; margin-block: 2rem; }
  .caso__cuerpo :global(h2) { margin-block: 2rem 1rem; }
  .caso__cuerpo :global(p) { margin-bottom: 1rem; }
</style>
```

- [ ] **Step 9: Probar que el esquema realmente protege**

Esta es la verificación central del modelo AI-first. Introducir un error a propósito:

```bash
# Romper un campo en un .md a proposito
sed -i 's/^industria:.*/industria: "inventada"/' src/content/case-studies/*.md
npm run build
```

Expected: **el build FALLA**, indicando archivo y campo inválido.

Revertir:

```bash
git checkout src/content/case-studies/
npm run build
```

Expected: build exitoso. Si el build **no** falló con el valor inválido, el esquema no está protegiendo y hay que arreglarlo antes de continuar.

- [ ] **Step 10: Verificar las rutas generadas**

```bash
ls dist/case-studies/
```

Expected: un directorio por cada `.md` publicado, más `index.html`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: case studies como content collection tipada

Un .md por caso genera su pagina de detalle y su tarjeta en el
listado. Un campo invalido rompe el build indicando archivo y campo."
```

---

## Task 7: Tabla leads_web y RLS

**Files:**
- Create: `supabase/migrations/20260720000000_leads_web.sql`

**Interfaces:**
- Consumes: nada
- Produces: tabla `public.leads_web` con las columnas de abajo — la Edge Function (T8) inserta ahí

**Refinamiento sobre el spec:** se agrega `ip_hash` (no estaba en §8). Es necesario para el límite por IP de la capa 3: sin almacenar algo por IP no hay contra qué contar. Se guarda **hasheada con sal**, no en claro, para no acumular datos personales innecesarios.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/20260720000000_leads_web.sql`:

```sql
-- Leads capturados por el formulario del sitio web.
-- Tabla separada de public.clientes a proposito: esta recibe entrada
-- publica no confiable. Los leads calificados se promueven a clientes
-- manualmente.

create table public.leads_web (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  apellido     text not null,
  email        text not null,
  telefono     text,
  motivo       text,
  tipo_empresa text check (tipo_empresa in ('saas','fintech','ecommerce','b2b','consumo','otro')),
  mensaje      text not null,
  estado       text not null default 'nuevo'
                 check (estado in ('nuevo','contactado','descartado','convertido')),
  ip_hash      text,
  created_at   timestamptz not null default now()
);

comment on table public.leads_web is
  'Leads del formulario web. Entrada publica: escribir solo via Edge Function submit-lead.';
comment on column public.leads_web.ip_hash is
  'SHA-256 de la IP + sal. Solo para rate limiting; nunca se guarda la IP en claro.';

create index leads_web_created_at_idx on public.leads_web (created_at desc);
create index leads_web_estado_idx     on public.leads_web (estado);
create index leads_web_ip_hash_idx    on public.leads_web (ip_hash, created_at desc);

-- RLS activo y SIN politicas para anon: el rol anonimo no puede leer ni
-- escribir. La Edge Function usa service_role, que hace bypass de RLS.
alter table public.leads_web enable row level security;

-- Lectura solo para usuarios autenticados (la consumira la app del OS).
create policy "leads_web_select_authenticated"
  on public.leads_web for select
  to authenticated
  using (true);
```

- [ ] **Step 2: Aplicar la migración**

Aplicar sobre el proyecto `ifzwkotwibylgbsxpggj` con la herramienta MCP `apply_migration`, nombre `leads_web`.

- [ ] **Step 3: Verificar que la tabla existe con RLS**

Ejecutar vía MCP `execute_sql`:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'leads_web';
```

Expected: una fila, `rowsecurity = true`.

- [ ] **Step 4: Verificar que anon no tiene acceso — prueba de seguridad**

Este paso es un criterio de aceptación, no una formalidad.

```sql
select polname, polroles::regrole[]
from pg_policy
where polrelid = 'public.leads_web'::regclass;
```

Expected: **una sola** política, para `authenticated`, de tipo SELECT. **Ninguna** política menciona `anon`. Con RLS activo y sin política para `anon`, ese rol no puede leer ni insertar.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: tabla leads_web con RLS cerrado a anon

Separada de clientes a proposito: recibe entrada publica no confiable.
Sin politicas para anon; solo service_role escribe (via Edge Function)."
```

---

## Task 8: Edge Function con anti-spam y notificación

**Files:**
- Create: `supabase/functions/submit-lead/index.ts`
- Create: `supabase/functions/submit-lead/validacion.ts`
- Create: `supabase/functions/submit-lead/validacion.test.ts`
- Create: `.env.example`

**Interfaces:**
- Consumes: tabla `leads_web` (T7)
- Produces: endpoint `POST /functions/v1/submit-lead`
  - Body JSON: `{ nombre, apellido, email, telefono?, motivo?, tipo_empresa?, mensaje, website?, turnstileToken }`
  - `website` es el honeypot — si viene con contenido, se descarta
  - Respuestas: `200 { ok: true }` | `400 { ok: false, error }` | `429 { ok: false, error }`

- [ ] **Step 1: Escribir los tests de validación**

Create `supabase/functions/submit-lead/validacion.test.ts`:

```typescript
import { assertEquals } from 'jsr:@std/assert';
import { validarLead } from './validacion.ts';

const valido = {
  nombre: 'Ada',
  apellido: 'Lovelace',
  email: 'ada@example.com',
  mensaje: 'Quiero hablar sobre growth para nuestro SaaS.',
  tipo_empresa: 'saas',
};

Deno.test('acepta un lead valido', () => {
  const r = validarLead(valido);
  assertEquals(r.ok, true);
});

Deno.test('rechaza email malformado', () => {
  const r = validarLead({ ...valido, email: 'no-es-un-email' });
  assertEquals(r.ok, false);
  assertEquals(r.error, 'email invalido');
});

Deno.test('rechaza mensaje demasiado corto', () => {
  const r = validarLead({ ...valido, mensaje: 'hola' });
  assertEquals(r.ok, false);
});

Deno.test('rechaza mensaje que excede 5000 caracteres', () => {
  const r = validarLead({ ...valido, mensaje: 'a'.repeat(5001) });
  assertEquals(r.ok, false);
});

Deno.test('rechaza campos obligatorios faltantes', () => {
  const r = validarLead({ ...valido, nombre: '' });
  assertEquals(r.ok, false);
});

Deno.test('rechaza tipo_empresa fuera del enum', () => {
  const r = validarLead({ ...valido, tipo_empresa: 'inventado' });
  assertEquals(r.ok, false);
});

Deno.test('acepta tipo_empresa ausente por ser opcional', () => {
  const { tipo_empresa: _, ...sinTipo } = valido;
  assertEquals(validarLead(sinTipo).ok, true);
});

Deno.test('honeypot lleno se rechaza', () => {
  const r = validarLead({ ...valido, website: 'http://spam.example' });
  assertEquals(r.ok, false);
  assertEquals(r.error, 'descartado');
});
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
deno test supabase/functions/submit-lead/validacion.test.ts --allow-all
```

Expected: FAIL — `Module not found: ./validacion.ts`

- [ ] **Step 3: Implementar la validación**

Create `supabase/functions/submit-lead/validacion.ts`:

```typescript
export const TIPOS_EMPRESA = ['saas', 'fintech', 'ecommerce', 'b2b', 'consumo', 'otro'] as const;

export interface Lead {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  motivo?: string;
  tipo_empresa?: string;
  mensaje: string;
  website?: string; // honeypot
}

export type Resultado =
  | { ok: true; lead: Omit<Lead, 'website'> }
  | { ok: false; error: string };

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validarLead(input: Record<string, unknown>): Resultado {
  // Capa 1: honeypot. Un humano nunca ve este campo.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return { ok: false, error: 'descartado' };
  }

  const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const nombre = txt(input.nombre);
  const apellido = txt(input.apellido);
  const email = txt(input.email);
  const mensaje = txt(input.mensaje);

  if (!nombre) return { ok: false, error: 'nombre requerido' };
  if (!apellido) return { ok: false, error: 'apellido requerido' };
  if (!RE_EMAIL.test(email)) return { ok: false, error: 'email invalido' };
  if (mensaje.length < 10) return { ok: false, error: 'mensaje demasiado corto' };
  if (mensaje.length > 5000) return { ok: false, error: 'mensaje demasiado largo' };

  const tipo = txt(input.tipo_empresa);
  if (tipo && !TIPOS_EMPRESA.includes(tipo as typeof TIPOS_EMPRESA[number])) {
    return { ok: false, error: 'tipo_empresa invalido' };
  }

  return {
    ok: true,
    lead: {
      nombre,
      apellido,
      email,
      telefono: txt(input.telefono) || undefined,
      motivo: txt(input.motivo) || undefined,
      tipo_empresa: tipo || undefined,
      mensaje,
    },
  };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

```bash
deno test supabase/functions/submit-lead/validacion.test.ts --allow-all
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Implementar la función**

Create `supabase/functions/submit-lead/index.ts`:

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { validarLead } from './validacion.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const NOTIFY_TO = Deno.env.get('LEAD_NOTIFY_TO')!;
const NOTIFY_FROM = Deno.env.get('LEAD_NOTIFY_FROM')!;
const IP_SALT = Deno.env.get('IP_HASH_SALT')!;
const ORIGEN_PERMITIDO = Deno.env.get('ALLOWED_ORIGIN')!;

const LIMITE_POR_HORA = 5;

const cors = {
  'Access-Control-Allow-Origin': ORIGEN_PERMITIDO,
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}

async function hashIp(ip: string): Promise<string> {
  const datos = new TextEncoder().encode(ip + IP_SALT);
  const buf = await crypto.subtle.digest('SHA-256', datos);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verificarTurnstile(token: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token, remoteip: ip }),
  });
  const data = await res.json();
  return data.success === true;
}

async function notificar(lead: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${RESEND_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      reply_to: lead.email,
      subject: `Nuevo lead web: ${lead.nombre} ${lead.apellido}`,
      text: [
        `Nombre:   ${lead.nombre} ${lead.apellido}`,
        `Email:    ${lead.email}`,
        `Telefono: ${lead.telefono ?? '-'}`,
        `Empresa:  ${lead.tipo_empresa ?? '-'}`,
        `Motivo:   ${lead.motivo ?? '-'}`,
        '',
        'Mensaje:',
        lead.mensaje,
      ].join('\n'),
    }),
  });
  if (!res.ok) {
    // El lead ya esta guardado: un fallo de correo no debe perder el lead.
    console.error('Fallo al enviar notificacion:', await res.text());
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'metodo no permitido' }, 405);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'desconocida';

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return json({ ok: false, error: 'JSON invalido' }, 400);
  }

  // Capas 1 y 4: honeypot + validacion de contenido.
  const v = validarLead(cuerpo);
  if (!v.ok) {
    // El honeypot devuelve 200 a proposito: no le confirmamos al bot que lo detectamos.
    if (v.error === 'descartado') return json({ ok: true }, 200);
    return json({ ok: false, error: v.error }, 400);
  }

  // Capa 2: Turnstile.
  const token = typeof cuerpo.turnstileToken === 'string' ? cuerpo.turnstileToken : '';
  if (!token || !(await verificarTurnstile(token, ip))) {
    return json({ ok: false, error: 'verificacion anti-bot fallida' }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const ipHash = await hashIp(ip);

  // Capa 3: limite por IP.
  const haceUnaHora = new Date(Date.now() - 3_600_000).toISOString();
  const { count, error: errConteo } = await supabase
    .from('leads_web')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', haceUnaHora);

  if (errConteo) {
    console.error('Error contando envios previos:', errConteo);
    return json({ ok: false, error: 'error interno' }, 500);
  }
  if ((count ?? 0) >= LIMITE_POR_HORA) {
    return json({ ok: false, error: 'demasiados envios, intenta mas tarde' }, 429);
  }

  const { error } = await supabase
    .from('leads_web')
    .insert({ ...v.lead, ip_hash: ipHash });

  if (error) {
    console.error('Error insertando lead:', error);
    return json({ ok: false, error: 'error interno' }, 500);
  }

  await notificar(v.lead);
  return json({ ok: true }, 200);
});
```

- [ ] **Step 6: Documentar las variables de entorno**

Create `.env.example`:

```bash
# Sitio (publicas, van al navegador)
PUBLIC_SUPABASE_URL=https://ifzwkotwibylgbsxpggj.supabase.co
PUBLIC_SUPABASE_ANON_KEY=
PUBLIC_TURNSTILE_SITE_KEY=

# Edge Function (secretas, NUNCA en el repo)
# Cargar con: supabase secrets set --env-file .env
TURNSTILE_SECRET_KEY=
RESEND_API_KEY=
LEAD_NOTIFY_TO=carlos@onestopdb.us
LEAD_NOTIFY_FROM=leads@themagichack.com
IP_HASH_SALT=
ALLOWED_ORIGIN=https://themagichack.com
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente en las Edge Functions — no se declaran.

- [ ] **Step 7: Desplegar y probar contra el endpoint real**

Desplegar con la herramienta MCP `deploy_edge_function`, nombre `submit-lead`.

Probar el honeypot (debe responder 200 sin escribir nada):

```bash
curl -s -X POST "https://ifzwkotwibylgbsxpggj.supabase.co/functions/v1/submit-lead" \
  -H "content-type: application/json" \
  -d '{"nombre":"Bot","apellido":"Spam","email":"bot@spam.com","mensaje":"mensaje de prueba largo","website":"http://spam.example"}'
```

Expected: `{"ok":true}`

Probar validación (debe rechazar):

```bash
curl -s -X POST "https://ifzwkotwibylgbsxpggj.supabase.co/functions/v1/submit-lead" \
  -H "content-type: application/json" \
  -d '{"nombre":"Ada","apellido":"L","email":"no-es-email","mensaje":"mensaje de prueba largo"}'
```

Expected: `{"ok":false,"error":"email invalido"}`

- [ ] **Step 8: Verificar que el honeypot no escribió**

Vía MCP `execute_sql`:

```sql
select count(*) from public.leads_web where email = 'bot@spam.com';
```

Expected: `0`. Si hay filas, el honeypot no está funcionando — arreglar antes de seguir.

- [ ] **Step 9: Commit**

```bash
git add supabase/ .env.example
git commit -m "feat: Edge Function submit-lead con 5 capas anti-spam

honeypot, Turnstile, limite 5/hora por IP hasheada, validacion de
contenido y campo estado. Notifica por correo via Resend.
La tabla queda cerrada a anon: solo esta funcion escribe."
```

---

## Task 9: Página de contacto conectada

**Files:**
- Create: `src/components/sections/ContactForm.astro`
- Create: `src/pages/contact.astro`
- Create: `src/pages/gracias.astro`
- Create: `tests/e2e/formulario.spec.ts`

**Interfaces:**
- Consumes: `Base` (T2), `Button` (T3), endpoint `submit-lead` (T8)
- Produces: ruta `/contact` funcional; `/gracias` tras envío exitoso

- [ ] **Step 1: Escribir los tests E2E del formulario**

Create `tests/e2e/formulario.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Formulario de contacto', () => {
  test('el honeypot esta presente y oculto', async ({ page }) => {
    await page.goto('/contact');
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toBeAttached();
    await expect(honeypot).not.toBeVisible();
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
  });

  test('valida campos obligatorios antes de enviar', async ({ page }) => {
    await page.goto('/contact');
    let llamadas = 0;
    await page.route('**/functions/v1/submit-lead', (route) => {
      llamadas++;
      route.fulfill({ status: 200, body: '{"ok":true}' });
    });

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(300);
    expect(llamadas, 'no debe llamar al endpoint con campos vacios').toBe(0);
  });

  test('envia y redirige a /gracias', async ({ page }) => {
    await page.goto('/contact');
    await page.route('**/functions/v1/submit-lead', (route) =>
      route.fulfill({ status: 200, body: '{"ok":true}' })
    );

    await page.fill('input[name="nombre"]', 'Ada');
    await page.fill('input[name="apellido"]', 'Lovelace');
    await page.fill('input[name="email"]', 'ada@example.com');
    await page.fill('textarea[name="mensaje"]', 'Quiero hablar sobre growth para nuestro SaaS.');
    await page.check('input[name="terminos"]');
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/gracias/);
  });

  test('muestra el error del servidor sin perder lo escrito', async ({ page }) => {
    await page.goto('/contact');
    await page.route('**/functions/v1/submit-lead', (route) =>
      route.fulfill({ status: 429, body: '{"ok":false,"error":"demasiados envios, intenta mas tarde"}' })
    );

    await page.fill('input[name="nombre"]', 'Ada');
    await page.fill('input[name="apellido"]', 'Lovelace');
    await page.fill('input[name="email"]', 'ada@example.com');
    await page.fill('textarea[name="mensaje"]', 'Quiero hablar sobre growth para nuestro SaaS.');
    await page.check('input[name="terminos"]');
    await page.locator('form button[type="submit"]').click();

    await expect(page.locator('[role="alert"]')).toContainText('demasiados envios');
    await expect(page.locator('input[name="nombre"]')).toHaveValue('Ada');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
npx playwright test tests/e2e/formulario.spec.ts
```

Expected: FAIL — `/contact` da 404.

- [ ] **Step 3: Implementar el formulario**

Create `src/components/sections/ContactForm.astro`. Los campos y labels salen literales de `contact.html:540-576`.

```astro
---
import Button from '../ui/Button.astro';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;

const TIPOS = [
  { valor: 'saas', label: 'SaaS company' },
  { valor: 'fintech', label: 'Fintech startup' },
  { valor: 'ecommerce', label: 'E-commerce brand' },
  { valor: 'b2b', label: 'B2B technology' },
  { valor: 'consumo', label: 'Consumer brand' },
  { valor: 'otro', label: 'Other' },
];
---
<form class="form" data-endpoint={`${SUPABASE_URL}/functions/v1/submit-lead`} novalidate>
  <div class="form__fila">
    <div class="form__campo">
      <label for="nombre">First name</label>
      <input id="nombre" name="nombre" type="text" required maxlength="256" />
    </div>
    <div class="form__campo">
      <label for="apellido">Last name</label>
      <input id="apellido" name="apellido" type="text" required maxlength="256" />
    </div>
  </div>

  <div class="form__fila">
    <div class="form__campo">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required maxlength="256" />
    </div>
    <div class="form__campo">
      <label for="telefono">Phone number</label>
      <input id="telefono" name="telefono" type="tel" maxlength="256" />
    </div>
  </div>

  <div class="form__campo">
    <label for="motivo">What brings you here?</label>
    <select id="motivo" name="motivo" required>
      <option value="">Select one...</option>
      {/* opciones literales del <select> de contact.html */}
    </select>
  </div>

  <fieldset class="form__campo">
    <legend>Company type</legend>
    {TIPOS.map((t) => (
      <label class="form__radio">
        <input type="radio" name="tipo_empresa" value={t.valor} />
        <span>{t.label}</span>
      </label>
    ))}
  </fieldset>

  <div class="form__campo">
    <label for="mensaje">Message</label>
    <textarea id="mensaje" name="mensaje" required maxlength="5000" placeholder="Tell us more"></textarea>
  </div>

  <label class="form__checkbox">
    <input type="checkbox" name="terminos" required />
    <span>I agree to the terms</span>
  </label>

  {/* Capa 1: honeypot. Oculto visualmente y fuera del orden de tabulacion. */}
  <div class="form__trampa" aria-hidden="true">
    <label for="website">No llenar este campo</label>
    <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
  </div>

  {/* Capa 2: Turnstile, invisible para el usuario real */}
  <div class="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-size="flexible"></div>

  <p class="form__error" role="alert" hidden></p>

  <Button type="submit" variant="alternate">Initiate sequence</Button>
</form>

<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<script>
  const form = document.querySelector<HTMLFormElement>('.form')!;
  const error = form.querySelector<HTMLParagraphElement>('.form__error')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const endpoint = form.dataset.endpoint!;

  function mostrarError(msg: string) {
    error.textContent = msg;
    error.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const datos = Object.fromEntries(new FormData(form));
    const turnstileToken =
      (form.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value ?? '';

    submit.disabled = true;
    submit.textContent = 'Sending...';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...datos, turnstileToken }),
      });
      const json = await res.json();

      if (json.ok) {
        window.location.href = '/gracias';
        return;
      }
      mostrarError(json.error ?? 'No se pudo enviar. Intenta de nuevo.');
    } catch {
      mostrarError('Error de red. Revisa tu conexion e intenta de nuevo.');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Initiate sequence';
    }
  });
</script>

<style>
  .form { display: grid; gap: 1.5rem; }
  .form__fila { display: grid; gap: 1.5rem; grid-template-columns: 1fr 1fr; }
  @media (max-width: 640px) { .form__fila { grid-template-columns: 1fr; } }
  .form__campo { display: grid; gap: 0.5rem; }
  .form__campo input, .form__campo select, .form__campo textarea {
    padding: 0.75rem;
    border: 1px solid var(--color-scheme-1--border);
    background: var(--color-scheme-1--background);
  }
  .form__campo textarea { min-height: 8rem; resize: vertical; }
  .form__radio, .form__checkbox { display: flex; align-items: center; gap: 0.5rem; }
  .form__trampa {
    position: absolute;
    width: 1px; height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .form__error { color: #c00; }
</style>
```

- [ ] **Step 4: Crear las páginas**

Create `src/pages/contact.astro` con `Base` + las secciones de `contact.html` + `ContactForm`.

Create `src/pages/gracias.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Button from '../components/ui/Button.astro';
---
<Base title="Thanks | TheMagicHack" description="Recibimos tu mensaje.">
  <section class="gracias">
    <h1>Message received</h1>
    <p>We'll get back to you shortly.</p>
    <Button href="/" variant="alternate">Back to home</Button>
  </section>
</Base>

<style>
  .gracias {
    max-width: 40rem;
    margin-inline: auto;
    padding: 8rem 1.5rem;
    text-align: center;
    display: grid;
    gap: 1.5rem;
    justify-items: center;
  }
</style>
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

```bash
npx playwright test tests/e2e/formulario.spec.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Prueba end-to-end real**

Con las variables de entorno configuradas, enviar el formulario **desde el navegador** con datos reales.

Verificar los tres efectos:

```sql
select nombre, apellido, email, tipo_empresa, estado, created_at
from public.leads_web
order by created_at desc limit 1;
```

Expected: la fila recién creada, con `estado = 'nuevo'`.

Y confirmar que **llegó el correo** a `LEAD_NOTIFY_TO`.

Si el correo no llega pero la fila sí existe: revisar logs de la función. El lead no se pierde por un fallo de correo (es intencional), pero hay que arreglar la notificación.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: formulario de contacto conectado a submit-lead

Reemplaza el <form method=get> sin action de Webflow, que no
enviaba a ningun lado. Incluye honeypot, Turnstile y manejo de
errores que preserva lo escrito."
```

---

## Task 10: Imágenes, animaciones, 404, CLAUDE.md y verificación final

**Files:**
- Modify: imágenes → `src/assets/` y `public/images/`
- Delete: 84 variantes `-p-*`, `css/`, `js/`, los 8 `.html` originales
- Create: `src/pages/404.astro`, `CLAUDE.md`, `README.md`

**Interfaces:**
- Consumes: todo lo anterior
- Produces: sitio completo listo para desplegar

- [ ] **Step 1: Reorganizar las imágenes**

Las que van en componentes o contenido → `src/assets/` (Astro las optimiza). Las referenciadas por URL fija (favicon, webclip, og) → `public/images/`.

```bash
# Verificar cuantas variantes se eliminan
ls images/ | grep -c -- "-p-"
```

Expected: `84`. Estas se borran: Astro genera las variantes responsive en build.

- [ ] **Step 2: Convertir las referencias a `<Image>`**

En cada componente, reemplazar `<img src="/images/foo.png">` por:

```astro
---
import { Image } from 'astro:assets';
import foo from '../../assets/foo.png';
---
<Image src={foo} alt="Texto alternativo descriptivo" widths={[400, 800, 1600]} sizes="(max-width: 768px) 100vw, 50vw" />
```

- [ ] **Step 3: Replicar las 27 animaciones `data-w-id`**

Con el sitio original en `localhost:8080`, recorrer cada página y **observar** cada elemento animado: qué tipo de animación (fade, slide, scale), qué la dispara (scroll, hover, carga), duración aproximada.

Patrón de reemplazo para revelado por scroll:

```astro
<style>
  [data-revelar] {
    opacity: 0;
    transform: translateY(1rem);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  [data-revelar][data-visible] { opacity: 1; transform: none; }

  @media (prefers-reduced-motion: reduce) {
    [data-revelar] { opacity: 1; transform: none; transition: none; }
  }
</style>

<script>
  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.setAttribute('data-visible', '');
          obs.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  document.querySelectorAll('[data-revelar]').forEach((el) => obs.observe(el));
</script>
```

**Anotar las animaciones que no se logren replicar fielmente** para reportarlas al usuario. Las curvas de easing exactas de Webflow no son observables — es esperable que alguna quede distinta.

- [ ] **Step 4: Crear la 404**

Create `src/pages/404.astro` con el copy literal de `404.html`.

- [ ] **Step 5: Borrar los archivos de Webflow**

Solo después de que todas las páginas estén migradas y verificadas.

```bash
git rm -r css/ js/ 401.html 404.html index.html services.html \
  case-studies-2.html case-studies/ contact.html \
  style-guide-5f09bdf0-13bc-4fe5-8982-e7c36d0777aa.html
git rm -r images/
```

El commit inicial `5dbb64c` conserva todo esto si hiciera falta consultarlo.

**Nota:** `tests/tokens.test.ts` lee `css/sebastians-fantabulous-site-974d51.webflow.css`. Antes de borrarlo, copiarlo a `tests/fixtures/webflow-original.css` y actualizar la ruta en el test, para que la paridad de tokens siga verificándose.

- [ ] **Step 6: Escribir CLAUDE.md**

Create `CLAUDE.md`:

```markdown
# MagicHack Web — convenciones

Sitio de marketing en Astro. Estático, sin CMS: **el contenido lo editan agentes**.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en :4321 |
| `npm run build` | Build de producción a `dist/` |
| `npm test` | Tests unitarios (vitest) |
| `npx playwright test` | Tests E2E y visuales |

## Reglas

1. **No reescribir copy** sin pedido explícito del usuario.
2. **No modificar valores en `src/styles/tokens.css`.** `tests/tokens.test.ts` falla si cambian. Para cambiar un color hay que actualizar también el test — la fricción es deliberada.
3. **Una sección = un archivo** en `src/components/sections/`. Si un archivo pasa de ~150 líneas, dividirlo.
4. **Cero dependencias de JS de cliente** sin justificarlo. Hay un test que falla si el JS supera 15 KB.
5. **Preferir HTML nativo:** `<details>` para acordeones y dropdowns, `<dialog>` para modales, `scroll-snap` para carruseles.
6. **Secretos nunca en el repo.** Ver `.env.example`.

## Agregar un case study

Crear `src/content/case-studies/<slug>.md` con el frontmatter que define `src/content.config.ts`. La página de detalle y la tarjeta del listado se generan solas.

Un campo faltante o inválido **rompe el build** indicando archivo y campo. Eso es intencional.

## Formulario de contacto

`ContactForm.astro` → Edge Function `submit-lead` → tabla `leads_web` (proyecto Supabase MagicHack_OS) + correo.

Cinco capas anti-spam: honeypot, Turnstile, límite 5/hora por IP hasheada, validación de contenido, campo `estado`.

`leads_web` está cerrada al rol `anon`: solo la Edge Function escribe. **Nunca abrir permisos de inserción a `anon`**, y nunca escribir directo en `clientes` desde el sitio.
```

- [ ] **Step 7: Suite completa**

```bash
npm run build
npm test
npx playwright test
```

Expected: todo pasa. **Si algo falla, no continuar** — arreglar primero.

- [ ] **Step 8: Verificar los criterios de aceptación medibles**

```bash
# Peso total de imagenes en el build
du -sh dist/_astro/ | cut -f1

# Confirmar que no queda rastro de webflow ni jQuery
grep -ril "webflow\|jquery" dist/ || echo "OK: sin rastro de Webflow"
```

Expected: imágenes bajo 5 MB; sin coincidencias de webflow/jquery.

- [ ] **Step 9: Comparación visual final**

Recorrer las 6 páginas lado a lado contra `baseline/`, en desktop y móvil. Preparar para el usuario:

- Lista de diferencias visuales detectadas y no resueltas
- Lista de animaciones que quedaron distintas del original
- Números finales: peso de JS antes/después, peso de imágenes antes/después

**Reportar honestamente. Ninguna diferencia se omite por ser menor.**

- [ ] **Step 10: Commit final**

```bash
git add -A
git commit -m "feat: imagenes optimizadas, animaciones replicadas, CLAUDE.md

Elimina el export de Webflow: 8 HTML, 3 CSS, webflow.js (686 KB),
jQuery y 84 variantes de imagen generadas a mano.
El commit inicial 5dbb64c conserva el original."
```

---

## Self-review

**Cobertura del spec:**

| Sección del spec | Tarea |
|---|---|
| §4 AI-first (archivos chicos, tipado, CLAUDE.md) | T2, T4, T6, T10 |
| §5 Stack Astro | T2 |
| §6 Estructura y páginas | T2, T4, T5, T6, T9, T10 |
| §7 Fuentes auto-alojadas | T2 |
| §7 Tokens copiados literal | T2 (con test de paridad) |
| §7 Copys literales | Constraint global; T4, T5, T6, T9 |
| §7 Imágenes optimizadas | T10 |
| §7 Verificación por screenshots | T1 (baseline), T4/T5/T9/T10 (comparación) |
| §8 Tabla `leads_web` + RLS | T7 |
| §8 Edge Function | T8 |
| §8 Anti-spam 5 capas | T8 (capas 1–4), T7 (capa 5: campo `estado`) |
| §8 Notificación por correo | T8 |
| §9 Componentes interactivos | T3 (acordeón, carrusel), T2 (menú móvil) |
| §9 Presupuesto de JS | T3 (test automatizado) |
| §10 Riesgo de las 27 animaciones | T10 (con reporte honesto) |
| §10 Git antes de editar | Hecho: commit `5dbb64c` |
| §12 Criterios de aceptación | T7 §4, T8 §8, T10 §7–9 |

**Desviaciones respecto del spec, deliberadas:**

1. **`ip_hash` agregado a `leads_web`** (T7). No estaba en §8. Es imprescindible para la capa 3 de anti-spam: sin persistir algo por IP no hay contra qué contar. Se guarda hasheada con sal, nunca en claro.
2. **Página `/gracias` agregada** (T9). El spec no la menciona. Un formulario necesita confirmación de éxito; la alternativa (mensaje inline) deja al usuario sin señal clara.
3. **Tabs y lightbox sin tarea propia.** §9 los lista (6 y 2 referencias). Se implementan dentro de la sección que los use, si aparecen al extraer el markup. Si no aparecen en las páginas migradas, no se construyen — YAGNI.

**Consistencia de tipos verificada:** `validarLead` devuelve `Resultado` con `lead: Omit<Lead,'website'>`; `index.ts` la consume como `v.lead` y le añade `ip_hash` — coincide con las columnas de la migración de T7. Los valores de `tipo_empresa` son idénticos en `TIPOS_EMPRESA` (T8), el `check` de la migración (T7) y el array `TIPOS` del formulario (T9): `saas`, `fintech`, `ecommerce`, `b2b`, `consumo`, `otro`. Los valores de `estado` coinciden entre migración y CLAUDE.md.

**Sin placeholders:** los pasos que producen código lo incluyen completo. Los que dicen "copiar el markup del HTML original" son extracción mecánica de un archivo existente y citan archivo y selector exactos.
