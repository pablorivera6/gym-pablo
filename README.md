# GYM Pablo

App personal para registrar entrenamientos y llevar la sobrecarga progresiva.
Funciona en el iPhone como una app normal, **sin internet** y **sin cuentas**:
todos los datos se guardan en el propio teléfono.

## Cómo instalarla en el iPhone

La app es una PWA: se instala desde Safari, no desde la App Store.

1. En el Mac, dentro de esta carpeta, ejecuta:
   ```
   npm run dev -- --host
   ```
   Te va a imprimir dos direcciones. Copia la de **Network**, algo como
   `http://192.168.1.34:5173`.
2. Conecta el iPhone al **mismo WiFi** que el Mac.
3. Abre esa dirección en **Safari** del iPhone.
4. Toca el botón **Compartir** (el cuadrito con la flecha hacia arriba).
5. Elige **"Añadir a pantalla de inicio"** → **Añadir**.

Listo: queda un ícono de mancuerna en tu pantalla de inicio. Ábrelo desde ahí
(no desde Safari) y se ve a pantalla completa, como una app nativa.

> La primera vez déjala abierta ~20 segundos con WiFi para que descargue las
> fotos de los ejercicios. Después funciona sin señal, incluso en el sótano del gym.

### Si quieres que funcione sin tener el Mac encendido

La opción de arriba necesita el Mac prendido y en el mismo WiFi. Para tenerla
siempre disponible, sube la carpeta `dist/` (la que genera `npm run build`) a
cualquier hosting estático gratuito — Netlify, Vercel o GitHub Pages — y abre esa
URL en el iPhone. El proceso de "Añadir a pantalla de inicio" es el mismo.

## Cómo funciona la sobrecarga progresiva

Usa **doble progresión**, que es el método estándar:

- Cada ejercicio tiene un rango, por ejemplo `2 × 8-12`.
- Mientras no llegues a **12 repeticiones en todas las series**, mantienes el peso.
- Cuando llegas al tope en todas, la app te sugiere **subir el peso** y volver al
  piso del rango:
  - **+2.5 kg** en ejercicios compuestos (press, sentadilla, remo, dominadas…)
  - **+1.25 kg** en aislamientos (curls, elevaciones, extensiones…)

La sugerencia es solo eso: siempre puedes escribir el peso que quieras.

## El ciclo

Ciclo de **9 días** que se repite. No es una semana fija, así que si te saltas un
día el ciclo no se desordena.

| Día | Entreno | Hoja |
|-----|---------|------|
| 1 | Pull | A |
| 2 | Chest | A |
| 3 | Legs | A |
| 4 | Descanso | — |
| 5 | Pull | B |
| 6 | Push | B |
| 7 | Legs | B |
| 8 | Arm Day | B |
| 9 | Descanso | — |

Al terminar un entreno, el ciclo avanza solo. En la pantalla **Hoy** puedes
moverlo a mano con las flechas ‹ › o tocando cualquier día de la tira.

## Respaldos

Los datos viven solo en este iPhone. Si borras los datos de Safari o desinstalas
la app, se pierden. En **Ajustes → Exportar respaldo** guardas un archivo `.json`
con todo tu historial, y con **Restaurar respaldo** lo recuperas.

## Desarrollo

```
npm install                        # instalar dependencias
npm run dev                        # servidor local
npm run build                      # genera dist/ listo para publicar
node scripts/fetch-exercises.mjs   # vuelve a bajar las fotos de los ejercicios
python3 scripts/make-icons.py      # regenera los iconos de la app
```

### Estructura

```
src/
  data/routine.ts        La rutina de las dos hojas + el ciclo de 9 días
  data/exerciseMeta.json Fotos y músculos de los 34 ejercicios de la rutina
  lib/store.ts           Estado en localStorage
  lib/progression.ts     Doble progresión, récords, historial para gráficas
  lib/meta.ts            Acceso a fotos y al catálogo de 876 ejercicios
  screens/               Hoy, Workout, Progreso, Historial, Ajustes
public/
  ex/<ejercicio>/0.jpg   Fotos descargadas (inicio y final del movimiento)
  catalog.json           876 ejercicios para añadir a la rutina
```

Fotos e información de ejercicios: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), dominio público.
