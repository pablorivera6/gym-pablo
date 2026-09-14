# GYM Pablo

App personal para registrar entrenamientos y llevar la sobrecarga progresiva.
Funciona en el iPhone como una app normal, **sin internet** y **sin cuentas**:
todos los datos se guardan en el propio teléfono.

## 📲 https://pablorivera6.github.io/gym-pablo/

## Cómo instalarla en el iPhone

1. Abre ese enlace en **Safari** (no en Chrome — el "añadir a pantalla de inicio" solo funciona bien en Safari).
2. Toca el botón **Compartir** (el cuadrito con la flecha hacia arriba).
3. Elige **"Añadir a pantalla de inicio"** → **Añadir**.

Queda un ícono de mancuerna en tu pantalla de inicio. Ábrelo desde ahí y se ve
a pantalla completa, como una app nativa.

> La primera vez déjala abierta ~30 segundos con WiFi para que descargue las
> 68 fotos de los ejercicios. Después funciona sin señal, incluso en el sótano del gym.

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
node scripts/fetch-exercises.mjs   # vuelve a bajar y procesar las fotos
python3 scripts/make-icons.py      # regenera los iconos de la app
```

Cada `git push` a `main` vuelve a publicar la app automáticamente
(ver `.github/workflows/deploy.yml`). No hay que subir nada a mano.

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

## Las fotos

Vienen de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio
público) y pasan por `scripts/fetch-exercises.mjs`, que para cada una:

1. Detecta al levantador con **Vision** (framework de macOS) y recorta un cuadrado
   cerrado sobre él — en el original la persona se veía pequeña en un salón enorme.
2. Le aplica un grado **desaturado de alto contraste** con viñeta, para que las 68
   fotos se vean como una sola serie y la técnica se lea sobre fondo oscuro.

El script solo corre en macOS (usa Vision y CoreImage). Las fotos ya procesadas
están versionadas, así que compilar la app no lo necesita.
