# El Espíritu Santo y el patrocinador

Explicador animado 16:9, **1920×1080, 12:00 exactos, sin audio**: la narración se graba
encima. Archivos: `film.html` + `core.js` + `kit.js` + `film.js`; vídeo `film.mp4`;
locución con marcas de tiempo en `guion.md`.

Formato nuevo respecto al resto del portafolio: horizontal, largo, dibujado sobre lienzo
(canvas) en vez de SVG, con cartelas de capítulo, banda inferior de progreso y gráficos de
datos. Dibujado a 12 fps (todo «a doses») y empaquetado a 24 fps.

## Estructura

| Tramo | Capítulo | Contenido |
| --- | --- | --- |
| 0:00 | Apertura | El gesto de Neymar, la frase de Daniel Alves, el título |
| 0:36 | 1 · El gesto | El resultado de la primera vuelta y lo que está en juego |
| 2:16 | 2 · La medida | La MP 1.394/2026 y lo que se lleva por delante |
| 4:26 | 3 · La contraofensiva | Los clubes en el Supremo y el plazo del Congreso |
| 6:06 | 4 · Los jugadores | Quién pide el voto, para quién, y con qué palabras |
| 7:56 | 5 · La fe | El censo, la selección y las dos campañas |
| 10:06 | 6 · El 25 de octubre | Lo que decide la urna y lo que no |
| 11:26 | Fuentes | Tarjeta final |

## Reglas de tratamiento

- **Las cuatro caras son dibujos**, hechos a mano con formas vectoriales, y van rotuladas
  en pantalla con la palabra «ilustración». No se calca ninguna fotografía.
- **No se reproduce ningún escudo, logotipo ni marca**: ni de clubes, ni de casas de
  apuestas, ni de partidos. Las camisetas son genéricas.
- El mapa es **simplificado y se dice que lo es**: sirve para situar, no para medir.
- La tesis de *The Times* sobre fe y declive deportivo aparece **etiquetada como opinión**,
  con la crítica que recibió.
- Sobre Daniel Alves se dice lo que está establecido: condena en España **anulada** y
  absolución en marzo de 2025 por falta de prueba suficiente.
- **No se da ningún porcentaje de voto evangélico por candidato**: no encontré publicado el
  cruce por religión de esta elección, y el vídeo dice en pantalla que por eso no lo da.

## Correcciones respecto al resumen de origen

| Resumen | Verificado |
| --- | --- |
| «la prohibición de los juegos de azar decretada por Lula» | Es la **MP 1.394/2026**, del 25 de septiembre. **No es definitiva**: depende del STF (ADI 8.027, ponente Fux, sin cautelar al 7 de octubre) y de que el Congreso la vote en plazo |
| «muchos clubes dependen de esos patrocinios» | **14 de los 20** de la Série A llevaban una casa de apuestas como patrocinador principal; **R$ 1.140 millones** en 2025, el **7,9 %** de los ingresos |
| «Neymar, Dani Alves y otros» | Neymar hizo el gesto del 22 sin declaración explícita según unos medios y con ella según otros. Explícitos y verificados: **Daniel Alves, Romário y Dedé** por Flávio; **Paulinho** por Lula |

## Datos verificados

| Dato | Fuente |
| --- | --- |
| Primera vuelta | TSE, 4 de octubre de 2026: Flávio Bolsonaro 47,03 % y Lula 45,16 % de los válidos; segunda vuelta el 25 de octubre |
| La diferencia | ~2,2 millones de votos, la menor desde la redemocratización; abstención del 21,1 %, la mayor desde 1998 |
| La medida | MP 1.394/2026, firmada el 25 de septiembre: prohíbe explotar, ofrecer, intermediar y publicitar loterías de cuota fija |
| El apagón | Saldos retirables hasta las 23:59 del 5 de octubre; plataformas fuera de línea el 6, sin cautelar que lo impidiera |
| Los clubes | 14 de 20 con patrocinador principal de apuestas; sin él: Bahia, Mirassol, Athletico-PR, Bragantino, Internacional y Coritiba |
| El dinero | R$ 1.140 millones en 2025, el 7,9 % de los ingresos de la Série A; Flamengo calcula perder entre 400 y 430 millones |
| El Grêmio | Cerró patrocinio con una casa de apuestas el 23 de septiembre, sin publicar cifras |
| El pleito | ADI 8.027 de la asociación del sector, ponente Fux; cinco clubes el 1 de octubre y después 16 en escrito conjunto; Flamengo y Botafogo aparte |
| El argumento | Falta de «relevancia y urgencia» exigidas a una medida provisional; piden un año de transición subsidiariamente |
| El Congreso | Plazo de enmiendas hasta el 13 de octubre; la MP decae si no se vota en el plazo constitucional |
| La consulta | Más de 218.000 manifestaciones en el Senado, 69,1 % a favor de la prohibición; no vinculante |
| Los apoyos | Daniel Alves el 5 de octubre («política de la obediencia»); Romário y Dedé por Flávio; Paulinho por Lula; el Corinthians desmintió una nota falsa hecha con IA |
| Daniel Alves, 2022 | Ya había declarado su voto a Jair Bolsonaro |
| Su caso judicial | Condena por agresión sexual en España anulada por el TSJ de Cataluña en marzo de 2025, con absolución por falta de prueba suficiente |
| La religión | IBGE, Censo 2022 (publicado en junio de 2025): católicos 56,7 % (65,1 % en 2010; 73,6 % en 2000), evangélicos 26,9 % (21,6 %; 15,4 %), sin religión 9,3 % |
| En personas | 47,4 millones de evangélicos y 100,2 millones de católicos |
| Por regiones | Norte 36,8 % evangélico; Centro-Oeste 31,4 %; Piauí 15,6 %, el menor, y el estado más católico |
| La selección | Recuento de la columna GENTE de *Veja* sobre los convocados por Ancelotti; *The Times* habla de al menos 20 de 26 |
| Neymar | Cinta «100 % Jesus» en la final de Champions de 2015; diezmo a la iglesia bautista en la que creció |
| Las campañas | Un frente evangélico de apoyo a Lula calificó de «retroceso» una victoria de Flávio; Quaest registró recuperación de Flávio entre evangélicos |

## Producción

```
CHROME=... node render.mjs film.html --grid 48      # hoja de contactos
CHROME=... node render.mjs film.html --only 184,8088 # fotogramas sueltos
CHROME=... node render.mjs film.html                 # render completo -> out/film.mp4
```

El vídeo sale **sin pista de audio** a propósito. Para montar la voz encima:

```
ffmpeg -i film.mp4 -i voz.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest final.mp4
```
