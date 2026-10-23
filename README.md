# requfy-landing

Sitio público de requfy (cliente de APIs para el teléfono), estático y bilingüe (español e inglés). Sin dependencias: HTML + un CSS, generado por un script de Node.

## Construir

Requiere Node 18 o superior.

```sh
npm run build   # genera docs/ desde content/ y static/
npm run check   # verifica enlaces, idiomas y metadatos
```

- `content/es.mjs` y `content/en.mjs`: todos los textos (el español es la fuente).
- `build.mjs`: layout compartido y generador.
- `static/`: CSS, imágenes e íconos; se copian a `docs/assets/`.
- `docs/`: salida generada. **Se commitea**, porque GitHub Pages la sirve.

Los enlaces son relativos, así que el sitio funciona bajo un subpath (`/requfy-landing/`).

## Selector de tema

En la barra de navegación, antes del selector de idioma: Sistema, Claro y Oscuro (`role="radiogroup"`, con flechas del teclado). La elección se guarda en `localStorage` (`requfy-theme`: `system` | `light` | `dark`) y se aplica con `data-theme` en `<html>`; sin atributo manda `prefers-color-scheme`. Un script mínimo en `<head>`, antes del CSS, la aplica antes del primer pintado (sin parpadeo); `static/theme.js` maneja el selector y el `theme-color`. Sin JavaScript el sitio sigue al sistema y el selector queda oculto. La 404 trae el mismo selector.

## Publicar en GitHub Pages

1. Crear el repo en GitHub y agregar el remoto (`git remote add origin ...`).
2. `git push -u origin main`.
3. Settings › Pages › Build and deployment › Deploy from branch › rama `main`, carpeta `/docs`.

## Completar en `site.config.mjs`

| Valor | Qué hace |
|---|---|
| `CONTACT_EMAIL` | Email de contacto en privacidad, términos, soporte y eliminar cuenta, como enlace `mailto:` (ya está definido: `developer.requfy@gmail.com`). En «Eliminar cuenta» el enlace trae el asunto prellenado. Si vuelve a ser un texto sin `@`, se muestra como marcador `[PENDIENTE…]` |
| `SITE_URL` | URL pública con barra final. Agrega `canonical`, `og:url` y `og:image` absoluto |
| `CUSTOM_DOMAIN` | El dominio propio que sirve GitHub Pages (`requfy.app`). El build lo escribe en `docs/CNAME`: sin eso, cada build borraría el dominio de Pages. `null` para usar `github.io` |
| `APP_STORE_URL` / `PLAY_STORE_URL` | Con valor, los botones son enlaces; con `null` dicen «Próximamente» |

Después de cambiar algo: `npm run build`, `npm run check` y commitear `docs/`.

## URLs para las tiendas

Reemplazar `<base>` por la URL pública del sitio.

| Qué | Español | Inglés |
|---|---|---|
| Política de privacidad | `<base>/es/privacidad/` | `<base>/en/privacy/` |
| Soporte | `<base>/es/soporte/` | `<base>/en/support/` |
| Eliminar cuenta | `<base>/es/eliminar-cuenta/` | `<base>/en/delete-account/` |
| Términos | `<base>/es/terminos/` | `<base>/en/terms/` |

La raíz (`<base>/`) redirige según el idioma del navegador.
