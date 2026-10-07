# No falsificaron al candidato

Explicador animado en collage de papel, vertical 9:16, ~93 s, en español, con voz
incrustada y música. Archivo autónomo: `brasil.html` (SVG + CSS + JS, sin imágenes
externas). Vídeo: `brasil-es.mp4`.

## Guion (8 escenas + fuentes)

1. **47-45** — El domingo Brasil votó para presidente: Flávio Bolsonaro 47%, Lula 45%.
   Hay segunda vuelta el 25 de octubre.
2. **Fácil** — Uno pensaría que el peligro es un vídeo falso del candidato diciendo algo
   horrible. Ese es el más fácil de dudar: sabes que alguien quiere hacerle daño.
3. **Cincuenta** — Aos Fatos encontró 50 vídeos con formato de entrevista en la calle.
   Ninguna de esas personas existe.
4. **7,4 M** — Juntaron 7,4 millones de visualizaciones antes de que TikTok los borrara. En
   casi uno de cada cinco ni siquiera avisaban de que estaban hechos con IA.
5. **920** — El proyecto VigIA, de la agencia Lupa con la Unicamp, contó 920 contenidos
   electorales con IA en seis semanas: casi uno por hora.
6. **6 de 10** — Seis de cada diez no llevaban la etiqueta que exige la ley electoral
   brasileña. 554 eran deepfakes y 29 salieron de perfiles oficiales de candidatos o partidos.
7. **55-45** — Una presentadora del telediario de la Band anunciaba una encuesta que no
   existió. La Lupa hizo búsqueda inversa y encontró el original: una emisión de diciembre.
8. **Compruébalo** — El truco ya no es mentir en boca del candidato: es ponerla en boca de
   alguien en quien ya confías. Si te llega algo enorme, búscalo en la web del noticiero.

## Reglas de tratamiento

- **No se dibuja la cara de ninguna persona real**: ni la de los candidatos ni la de la
  presentadora. Dibujarlas sería repetir exactamente lo que el vídeo denuncia. El
  candidato aparece como un atril con un cartel; la presentadora, como una silueta sin
  rostro en un plató.
- Los «vecinos» fabricados de la escena 3 son recortes de papel **sin cara**, con la
  etiqueta de IA tachada a la vista.
- La bandera de Brasil aparece en las escenas 1, 3, 5 y 8.
- Se atribuye cada dato a quien lo publicó (Aos Fatos, Lupa/Unicamp, TSE) y no se dice ni
  insinúa a quién favorecía la desinformación.

## Correcciones respecto al relato de origen

| Afirmación de origen | Lo verificado |
| --- | --- |
| «la herramienta Haiku detectó el vídeo manipulado» | La Lupa usó **búsqueda inversa** y un detector de contenido generado con IA (**Hive**). Haiku no es un detector de deepfakes, y el cierre de «la IA que los fabrica es la que los caza» no se sostiene: lo decisivo fue la búsqueda inversa |
| «la cadena Ant» | **Band**: el vídeo manipulaba a una presentadora del *Jornal da Band*; el original era la emisión del 1 de diciembre de 2025 |
| «50 vídeos, más de 7 millones de vistas» | Correcto: 50 contenidos y **7,4 millones** de visualizaciones. En el **18%** no había ninguna indicación de IA. TikTok los retiró todos |
| «6 de cada 10 sin etiqueta» | Correcto, y el dato exacto es que **solo 371 de los 920** estaban señalados. **554** eran deepfakes; **29** salieron de perfiles oficiales de candidatos o partidos y 525 de usuarios |

Un matiz que el relato de origen omite: el grueso de esos contenidos no estaba en TikTok,
sino en **Facebook (559) e Instagram (365)**; TikTok sumó 70.

## Datos verificados

| Dato | Fuente |
| --- | --- |
| Primera vuelta | TSE, 4 de octubre de 2026: Flávio Bolsonaro 47,2% y Lula 44,9% de los votos válidos; segunda vuelta el 25 de octubre |
| Votantes generados con IA | Aos Fatos, 24 de agosto de 2026: 50 contenidos en TikTok, ~7,4 millones de visualizaciones |
| Sin aviso | En el 18% no había indicación de que las personas fueran generadas con IA |
| Retirada | TikTok eliminó todos los contenidos señalados por infringir sus normas |
| VigIA | Agencia Lupa con Recod.ai (Unicamp): 920 contenidos confirmados entre el 16 de agosto y el 28 de septiembre, de 1.941 sospechosos |
| Etiquetado | Solo 371 de los 920 estaban correctamente señalados; 554 eran deepfakes |
| Origen | 29 deepfakes partieron de perfiles oficiales de candidatos o partidos; 525, de usuarios |
| Encuesta falsa | Lupa, 8 de septiembre de 2026: vídeo con una presentadora del *Jornal da Band* difundiendo una encuesta inexistente (55 a 45) |

## Producción

```
python3 voice.py --audio audio-es     # Kokoro-82M local, voz em_alex, espeak es-419
python3 build.py                      # 92,8 s; voz 79,7 s
node rec.mjs out/frames.mp4 brasil.html
ffmpeg ... -i out/frames.mp4 -i out/mix.m4a ... brasil-es.mp4
```
