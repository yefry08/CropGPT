# Tensión Global

Juego web de estrategia para dos bandos —**Occidente** (azul) y el **Bloque Oriental** (rojo)— ambientado entre 1947 y 2026.
Se reparte influencia, se provocan golpes, se activan eventos históricos, se puntúan regiones y se vigila la **Tensión nuclear**
y, desde 1991, el **Riesgo de IA**. Mecánicas inspiradas en los juegos de «cartas y mapa» sobre la Guerra Fría; nombre, textos,
reglas concretas y arte son originales. Todo el juego está en español.

- **Un jugador** contra una IA (Fácil / Normal / Difícil). Todo corre en el navegador con la misma lógica de `/shared`.
- **Online 1 contra 1** con servidor autoritativo (Node + Socket.IO): sala de 6 caracteres, elección de bando, chat,
  reconexión con token guardado en `localStorage` y **espectadores** mediante enlace.

> Este juego vive en el subdirectorio `tension-global/` del repositorio (la raíz contiene otro proyecto).

## Estructura

```
tension-global/
├─ shared/   Reglas puras y deterministas (TypeScript): países, cartas, motor, IA, simulación, tests (Vitest)
├─ server/   Node + Express + Socket.IO. Valida cada acción con el motor de /shared y emite vistas por jugador
├─ client/   Vite + React. Mapa con d3-geo + topojson-client + world-atlas (countries-50m)
├─ Dockerfile · fly.toml · render.yaml
```

## Desarrollo local

Requiere Node 20 o superior.

```bash
cd tension-global
npm install
npm run dev          # servidor en :3001 y cliente Vite en http://localhost:5173 (con proxy de Socket.IO)
```

Abre <http://localhost:5173>. Para probar el modo online abre dos pestañas (o una ventana privada): crea una sala en una
y únete con el código en la otra.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Tests de reglas y flujo + simulación de equilibrio (≈ 90 s en total) |
| `npm run typecheck` | Comprobación de tipos de los tres paquetes |
| `npm run build` | Compila el cliente (`dist/public`) y empaqueta el servidor (`dist/server.cjs`) |
| `npm start` | Ejecuta el servidor ya compilado (sirve también el cliente) en `PORT` (3001 por defecto) |
| `npm run sim -w shared -- 200` | Simula 200 partidas IA contra IA e imprime el porcentaje de victorias |
| `npm run tune -w shared -- '{"pl":{"E":2}}' 300` | Prueba un cambio de influencia inicial sin editar el código |
| `npx tsx shared/scripts/compare-levels.ts hard normal` | Enfrenta dos niveles de IA (120 partidas, intercambiando bandos) |
| `npm run layout-chips -w shared` | Recalcula los desplazamientos de fichas del mapa (ver más abajo) |

Variables de entorno del servidor: `PORT`, `CORS_ORIGIN` (lista separada por comas; por defecto cualquiera) y `STATIC_DIR`
(carpeta del cliente compilado, si no es `dist/public`).

## Despliegue

El servidor guarda las salas **en memoria**, así que debe ejecutarse como **una sola instancia** (no escalar horizontalmente).
Una sola imagen Docker sirve el cliente y los WebSockets; expone `/healthz`.

### Con Docker (local)

```bash
cd tension-global
docker build -t tension-global .
docker run --rm -p 8080:8080 tension-global      # http://localhost:8080
```

### Hugging Face Spaces (gratis, sin tarjeta)

Un *Space* de tipo Docker admite WebSockets, así que funciona el juego completo (un jugador y online). En el plan gratuito
se duerme tras un tiempo sin visitas: al despertar tarda un poco y se pierden las salas en curso.

1. En <https://huggingface.co/new-space> crea un Space con **SDK: Docker** (plantilla en blanco) y hardware gratuito.
2. Elige cómo subir el código:
   - **Automático (GitHub Actions):** en *Settings → Secrets and variables → Actions* del repositorio de GitHub, crea el secreto
     `HF_TOKEN` (token de <https://huggingface.co/settings/tokens> con permiso *Write*) y la variable `HF_SPACE`
     (`tu-usuario/nombre-del-space`). Luego ejecuta *Actions → Publicar Tensión Global en Hugging Face Spaces → Run workflow*.
     También se ejecuta solo al subir cambios de `tension-global/` a `main`.
   - **A mano:**
     ```bash
     git clone https://huggingface.co/spaces/tu-usuario/nombre-del-space hf-space
     sh tension-global/scripts/build-hf-space.sh hf-space
     cd hf-space && git add -A && git commit -m "Tensión Global" && git push
     ```
3. El Space construye la imagen y queda en `https://tu-usuario-nombre-del-space.hf.space`.
4. Login opcional: en *Settings* del Space añade la variable `VITE_NEON_AUTH_URL` y `NEON_AUTH_JWKS_URL`, y registra ese dominio
   `.hf.space` como dominio de confianza en Neon Auth.

### Render

1. Crea un **Web Service** desde este repositorio, runtime **Docker**, **Root Directory** `tension-global`
   (o usa el blueprint `tension-global/render.yaml`).
2. *Health check path*: `/healthz`. Render inyecta `PORT` automáticamente.
3. Usa un plan que no se duerma: en el plan gratuito la instancia se suspende y se pierden las salas en curso.
4. Los WebSockets funcionan sin configuración adicional.

### Fly.io

```bash
cd tension-global
fly launch --no-deploy --copy-config      # acepta fly.toml; cambia `app` por un nombre libre
fly deploy
fly scale count 1                         # imprescindible: el estado está en memoria
```

`fly.toml` mantiene una máquina siempre encendida (`auto_stop_machines = "off"`, `min_machines_running = 1`) y define el
chequeo de salud en `/healthz`.

### Cuentas con Neon Auth (opcional)

El modo online puede exigir inicio de sesión con [Neon Auth](https://neon.com/docs/auth/overview) (Managed Better Auth). Es
opcional: sin las variables de abajo el juego funciona sin cuentas. El modo un jugador nunca requiere sesión, y los
espectadores tampoco.

| Dónde | Variable | Valor |
|---|---|---|
| Cliente (en la *build*) | `VITE_NEON_AUTH_URL` | URL de Auth de la rama, p. ej. `https://ep-…neonauth….aws.neon.tech/neondb/auth` |
| Servidor | `NEON_AUTH_JWKS_URL` | `<URL de Auth>/.well-known/jwks.json` |
| Servidor (opcional) | `NEON_AUTH_ISSUER` | emisor esperado del JWT, si quieres comprobarlo |

Cómo funciona: el cliente inicia sesión (correo y contraseña) con `@neondatabase/auth`, y en cada conexión del socket envía el
JWT de 15 minutos. El servidor lo verifica (EdDSA) contra el JWKS con `jose`; el nombre en la sala sale de la cuenta y el asiento
queda ligado a su id, de modo que otra cuenta no puede recuperarlo con el token de sala. Con Docker pasa la URL al construir:
`docker build --build-arg VITE_NEON_AUTH_URL=… .`

En la consola de Neon, **añade como dominios de confianza** los orígenes del cliente (tu dominio de Render/Fly y
`http://localhost:5173`); si no, Auth responde `invalid domain`. Comprueba la integración del servidor sin red con
`npx tsx server/scripts/auth-check.ts` (usa un JWKS falso local).

> En la versión de GitHub Pages el login no se muestra: allí no hay modo online.

### GitHub Pages (solo un jugador)

Pages solo sirve archivos estáticos: el modo contra la IA funciona entero en el navegador, pero el **online no** (necesita el
servidor Node). `npm run build:pages` genera esa versión en `dist/public` (sin la sección online). El workflow
`.github/workflows/pages.yml` la publica; activa antes *Settings → Pages → Source: GitHub Actions*. Se ejecuta al subir a
`main` o manualmente (*Run workflow*); si Pages rechaza otra rama por reglas del entorno `github-pages`, ejecútalo desde `main`.

## Cómo se juega (resumen)

* **Tiempo:** 10 turnos de 6 rondas; en cada ronda el Bloque Oriental juega primero. 5 eras de 2 turnos:
  Telón de Acero (1947–62), Coexistencia y crisis (1962–79), Ocaso de la Guerra Fría (1979–91), Momento unipolar (1991–2008)
  y Orden multipolar (2008–26). Al empezar cada era salen del mazo las cartas de la era anterior y entran las nuevas; las
  genéricas y las de puntuación se mantienen. Al iniciar la era 4 se disuelve la URSS (desaparece Alemania Oriental, aparecen
  Ucrania, Georgia, Kazajistán y Emiratos, el Bloque Oriental pierde 1 de influencia en Polonia, Chequia, Hungría,
  Afganistán y Etiopía, y la Tensión vuelve a 5).
* **Mano:** 7 cartas con 1–4 ops. Cada carta es de un bando o neutral, o es de puntuación.
* **Jugar una carta:** *Evento* (solo propia o neutral; algunas se retiran), *Operaciones* (si es del rival, su evento se
  activa antes), *Tecnología* (una vez por turno, con ops mínimos; descarta sin activar el evento) o *Puntuar*.
* **Influencia:** 1 punto por ficha en países donde ya tienes influencia, en sus vecinos o en vecinos de tu superpotencia;
  cuesta 2 si el rival controla el país. **Control:** influencia ≥ estabilidad y ventaja ≥ estabilidad.
* **Golpe:** `1d6 + ops − 2×estabilidad`. Si es positivo quitas esa influencia rival y el sobrante pasa a ser tuyo.
  En un país clave baja la Tensión 1.
* **Tensión (5 → 1):** sube 1 al inicio de cada turno. Con 4 no hay golpes en Europa; con 3 tampoco en Asia; con 2 tampoco en
  Medio Oriente. Si una acción tuya (evento o golpe) la lleva a 1 **pierdes**; si lo hace un evento rival activado por tus
  operaciones, se queda en 2.
* **Guerras:** `1d6 − 1` por cada vecino controlado por el rival; con 4+ ganas PV y sustituyes la influencia rival.
* **Puntuación de región** (Presencia / Dominio / Control): Europa 3/7/12, Asia 3/7/9, Medio Oriente 3/5/7, Américas 2/5/7,
  África 1/4/6, más +1 por país clave controlado y +1 por país controlado vecino de la superpotencia rival. Una carta de
  puntuación retenida al final del turno se puntúa sola. Europa, Asia y Medio Oriente existen desde la era 1; África y
  Américas, desde la era 2.
* **Victoria:** 20 PV al instante, o liderar tras la puntuación final de todas las regiones en 2026.
* **Carrera tecnológica (8 hitos):** Satélite, Vuelo tripulado, Alunizaje, ARPANET, GPS, Internet global, Smartphone e IA avanzada.
  Ops mínimos 2/2/2/3/3/3/3/4; éxito con 3 o menos en 1d6 (4 o menos si vas por detrás); PV al primero 2/1/3/1/2/2/3/4 y al
  segundo 1/0/1/0/1/1/1/2.
* **IA:** *Riesgo de IA* (0–10, activo desde la era 4): al final de cada turno con riesgo ≥ 8 hay un **Incidente** (el bando
  con más tecnología pierde 3 PV, la Tensión baja 1 y el riesgo vuelve a 5). *Capacidad de IA* (0–5 por bando): cada nivel
  suma 1 op al primer golpe de cada turno; sube con cartas y con los hitos ARPANET, Internet global e IA avanzada.

### Decisiones de interpretación

Puntos que el diseño dejaba abiertos y cómo se resolvieron (todos están cubiertos por tests):

* **PV (−20…+20):** positivo favorece a Occidente. «Ambos bandos pierden 5 PV» (Riesgo de IA = 10) se modela como un
  acercamiento del marcador al centro de hasta 5 puntos, porque en un marcador relativo restar lo mismo a ambos no cambiaría
  nada. El riesgo vuelve a 5 y la Tensión baja 2 (nunca por debajo de 2).
* **Incidente de IA con igual tecnología** (hitos + Capacidad): ambos pierden 2 PV (acercamiento al centro).
* **Eventos del rival por operaciones:** el evento se resuelve **antes** de colocar la influencia o hacer el golpe; si crea una
  colocación libre para el rival, este la resuelve primero.
* **Colocación encadenada:** la influencia puesta durante la misma acción abre a sus vecinos para los puntos siguientes.
* **Adyacencias «vía»:** donde se interpone un país no jugable (Camerún, Tanzania, Namibia, Honduras/El Salvador, Costa
  Rica, Laos/Camboya, Bulgaria) la ruta está marcada en `shared/src/countries.ts`.
* **Cartas de eras anteriores en la mano** se conservan hasta jugarse; al cambiar de era el descarte se baraja con el mazo.
* **Desconexión:** la partida sigue en el servidor y espera a quien tenga el turno; puede reconectarse con su enlace.

## IA rival

`shared/src/ai.ts`. Valora cada carta como evento (simulando su efecto), operaciones de influencia, golpe, tecnología o
puntuación:

* **Influencia:** colocación voraz punto a punto; maximiza el cambio de valor por coste, priorizando ganar o romper control en
  países clave, regiones cuya carta de puntuación tiene en mano (o con el final de la partida cerca) y países baratos. Tiene en
  cuenta el cambio real de «si se puntuara ahora» de la región.
* **Golpes:** valor esperado sobre los seis resultados del dado. Nunca golpea un país clave con Tensión 2 o menos.
* **Seguridad:** descarta cualquier evento propio que provoque su derrota por Tensión (se comprueba simulándolo).
* **Niveles:** *Fácil* añade mucho ruido y un 15 % de jugadas al azar; *Normal* poco ruido; *Difícil* apenas ruido y simula
  el resultado completo de las tres mejores jugadas antes de decidir.

## Pruebas

```bash
npm test
```

* `shared/test/rules.test.ts`: datos, control, coste de influencia, golpes (fórmula, restricciones por Tensión, país clave,
  bono de IA), puntuación de regiones, victoria inmediata, vistas ocultas y eventos.
* `shared/test/flow.test.ts`: orden de juego, subida de Tensión por turno, carrera tecnológica, Riesgo y Capacidad de IA,
  cambios de era (URSS, mazo), determinismo y seguridad de la IA.
* `shared/test/balance.test.ts`: **500 partidas IA contra IA**; ningún bando puede ganar más del 55 %.

### Ajuste del equilibrio

La influencia inicial está en `shared/src/setup.ts`. Se afinó con `npm run tune`: la configuración inicial base (Reino Unido 5,
Alemania Occ. 4, Canadá 2… frente a Corea del Norte 3, Alemania Or. 3…) daba ~62–66 % a Occidente; reforzar a los estados satélite de Europa central (Polonia 2, Checoslovaquia 1,
Hungría 1, Rumanía 1) y Siria (2) dejó ambos bandos entre el 46 % y el 54 % en distintos rangos de semillas.
Si cambias cartas, reglas o la IA, vuelve a ejecutar `npm test` y reajusta si hace falta.

## Mapa

* `client/src/lib/geo.ts` carga `world-atlas/countries-50m.json`, aplica proyección **Natural Earth** recortada entre las
  latitudes −56° y 78°, y agrupa polígonos: Yugoslavia/Serbia (incluye Kosovo), Checoslovaquia (Chequia + Eslovaquia),
  Sahel (Malí + Níger + Burkina Faso). Hasta 1991 las repúblicas soviéticas se pintan como URSS; Alemania se parte en dos
  (frontera interalemana aproximada) hasta 1991. Los fragmentos lejanos (p. ej. Guayana Francesa) se pintan como terreno neutro.
* Colores: azul claro / rojo claro / neutro según el control; borde dorado en países clave; insignias **EU** y **RU** en los
  vecinos de las superpotencias.
* Las fichas se desplazan donde el espacio es estrecho y se unen al país con una línea guía. Los desplazamientos
  (`CHIP_OFFSETS` en `shared/src/countries.ts`) los calcula `shared/scripts/layout-chips.ts`, que minimiza solapes a seis
  niveles de zoom; vuelve a ejecutarlo si cambias anclas o tamaños de ficha.
* Zoom con rueda, pellizco y arrastre; botones Mundo / Europa / Medio Oriente / Asia / África / Américas.
  Las adyacencias se dibujan solo al pasar el cursor o al elegir un objetivo.

## Protocolo online (Socket.IO)

Cliente → servidor: `room:create`, `room:join` (con `token` para reconectar o `spectator`), `room:side`, `room:ready`,
`game:action`, `chat:send`. Servidor → cliente: `room:info`, `game:state` (vista del jugador: solo su mano), `chat:history`,
`chat:msg`. Los tipos están en `shared/src/protocol.ts`. El servidor aplica cada acción con `applyAction` del motor compartido
y rechaza las ilegales con un mensaje de error.

## Licencias y créditos

Datos geográficos: [world-atlas](https://github.com/topojson/world-atlas) (Natural Earth, dominio público).
Tipografías: Big Shoulders Stencil Display e IBM Plex Sans Condensed (Google Fonts, SIL OFL).
