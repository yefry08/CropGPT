# El nuevo complejo

Explicador animado en collage de papel, vertical 9:16, ~83 s, en español, con voz
incrustada y música. Archivo autónomo: `complejo.html` (SVG + CSS + JS, sin imágenes
externas). Vídeo: `complejo-es.mp4`.

## Guion (8 escenas + fuentes)

1. **Diez** — Un fabricante ucraniano de drones contó que, en una prueba, diez drones
   atacaron por su cuenta en «modo Terminator». Lo contó él: no hay grabación.
2. **Otra vez** — El mismo titular ya se publicó en 2021, con un informe de la ONU sobre
   Libia. Tampoco se pudo confirmar.
3. **1961** — Lo que sí es comprobable es quién fabrica estas armas. Eisenhower avisó del
   complejo militar-industrial en su discurso de despedida.
4. **2017** — El fundador que vendió sus gafas de realidad virtual a Facebook por 2.000
   millones salió de la empresa y montó una fábrica de armas.
5. **30.500** — En un año pasó de valer 14.000 millones a 30.500, y se quedó el contrato de
   22.000 millones de gafas de combate que Microsoft no sacó adelante.
6. **Cuatro** — En julio de 2025 el Pentágono firmó con cuatro laboratorios de IA, hasta
   200 millones de dólares cada uno.
7. **Permitido** — No hay prohibición: la norma estadounidense solo pide «niveles
   apropiados de juicio humano», y la ley europea de IA no se aplica a lo militar.
8. **Contratos** — La pregunta no es cuándo mató la primera máquina: es quién decide dónde
   se queda el humano. Y hoy eso lo deciden contratos.

## Reglas de tratamiento

- **El vídeo no afirma que esto fuera la primera vez que una IA mató.** El relato de la
  prueba ucraniana procede de una sola fuente interesada, sin grabación ni verificación
  independiente, y así se dice en pantalla (escena 1) y en la tarjeta de fuentes.
- **No se vincula a la empresa de armas de las escenas 4-5 con la prueba ucraniana.** No
  hay ninguna prueba de esa relación; la tarjeta final lo dice explícitamente.
- **No se dibuja a ninguna persona**: ni a Eisenhower, ni al fundador, ni a soldados. Solo
  máquinas, papeles, dinero y contratos.
- Los cuatro laboratorios de IA de la escena 6 no se nombran en la animación; aparecen en
  la tarjeta de fuentes, que es donde corresponde el dato.
- Sin logotipos de terceros y sin la marca de ninguna herramienta usada para producirlo.

## Datos verificados

| Dato | Fuente |
| --- | --- |
| Prueba de diez drones «en modo Terminator» | Relato de un fabricante ucraniano de drones; sin grabación ni verificación independiente. Se describe como una prueba única que no se implementó |
| Antecedente de 2021 | Informe del Grupo de Expertos de la ONU sobre Libia; ni la autonomía ni las muertes llegaron a confirmarse |
| «Complejo militar-industrial» | Discurso de despedida de Eisenhower, 17 de enero de 1961 |
| Gafas de realidad virtual | Oculus, vendida a Facebook por unos 2.000 M $ en 2014; su fundador salió de la empresa en marzo de 2017 |
| Fábrica de armas | Fundada en junio de 2017 |
| Valoración | 30.500 M $ tras una ronda de 2.500 M $ en junio de 2025, frente a 14.000 M $ el año anterior |
| Gafas de combate | Programa IVAS, ~22.000 M $, traspasado desde Microsoft en febrero de 2025 |
| Pentágono y laboratorios | 14 de julio de 2025: acuerdos de hasta 200 M $ cada uno con OpenAI, Anthropic, Google y xAI |
| Norma estadounidense | Directiva 3000.09 del Departamento de Defensa: «niveles apropiados de juicio humano» |
| Norma europea | Reglamento Europeo de IA, artículo 2: excluye los usos exclusivamente militares |

## Producción

```
GEMINI_API_KEY=... python3 narrate.py --spec sections-es.json --audio audio-es   # Gemini TTS, voz Charon
python3 build.py
node rec.mjs out/frames.mp4 complejo.html
ffmpeg ... -i out/frames.mp4 -i out/mix.m4a ... complejo-es.mp4
```
