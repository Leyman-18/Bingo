# BingoClub

Sala de bingo de 90 bolas: el anfitrión canta los números y reparte cartones (con PDF para imprimir) y los jugadores ven sus cartones marcados en vivo.

## Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub e impórtalo en Vercel (framework: **Other**, sin comando de build).
2. En tu proyecto: **Storage → Create Database → Upstash for Redis** (Marketplace) y conéctalo al proyecto. Vercel agrega solo `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. En **Settings → Environment Variables** crea `BINGO_HOST_KEY` con la clave que usarás como anfitrión.
4. Haz **Redeploy**.

## Uso

- Anfitrión: abre la página, pulsa **Soy el anfitrión** e ingresa la clave. Crea la sala, reparte cartones y canta.
- Jugadores: abren la misma dirección, escriben su nombre en **Mis cartones** y ven los números marcados (se actualiza cada 3 segundos).
- Sin la base de datos configurada, la página funciona en modo local (solo en ese navegador).
