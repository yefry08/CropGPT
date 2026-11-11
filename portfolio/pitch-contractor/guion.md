# Contractor AI · Pitch de 90 segundos (en cámara, sin animaciones)

Formato tomado del video de Cuidao' que enviaste: fondo claro y liso, cada persona sola en plano medio, rótulo con nombre y rol,
textos cortos en pantalla y cierre con el nombre del proyecto. Todo grabado por ustedes; el editor solo corta, une, pone
rótulos fijos y nivela el audio.

## Guion (inglés, ~80 s con las presentaciones)

| # | Quién | Pregunta que responde | Texto | ~s |
|---|---|---|---|---|
| 1 | A | ¿Qué problema? | Latin American governments publish their public contracts, but almost nobody can read them. Overpricing goes unnoticed, and the money doesn't reach the places that need it most. | 12 |
| 2 | B | ¿Producto y cómo lo resuelve? ¿Funciones clave? | Contractor AI fixes that. Our models compare every contract with similar ones and flag unusual prices. We show what each institution buys, which contracts deserve a closer look, and what each municipality needs most, right next to where its money goes. | 18 |
| 3 | C | ¿Por qué es único? | What makes us unique: one method across ten countries, each town's needs linked to its spending, and every alert traced back to its official source. | 11 |
| 4 | A | ¿Potencial local, regional y global? ¿Por qué? | We start locally, in Chile, with ChileCompra. Regionally, we already cover ten Latin American countries. And globally, because we build on the Open Contracting Data Standard, any country that publishes it can be added. | 15 |
| 5a | A | ¿Quién es el equipo? | I'm [Name A], [what A brings, máx. 8 palabras]. | 4 |
| 5b | B | | I'm [Name B], [what B brings]. | 4 |
| 5c | C | | And I'm [Name C], [what C brings]. | 4 |
| 6 | C | ¿Por qué son el equipo indicado? | We're the right team because we built it ourselves. It's live, free, in three languages, with almost fifty thousand contracts. | 9 |
| 7 | Los tres juntos | Cierre | Public money should be easy to follow. | 4 |
| | | | Tarjeta final: «Contractor AI · Public money should be easy to follow.» | 2,5 |

**Cambios respecto a tu borrador:**
- **Bloque 4:** ahora dice «locally / regionally / globally» con el porqué de cada uno. El jurado lo pregunta tal cual.
- **Bloque 5:** cada persona dice su propia línea en su toma. Así el jurado ve a cada uno con su rótulo, como en Cuidao'.
- **Bloque 6:** empieza con «We're the right team because…», para que se reconozca que responde a esa pregunta.
- **Lo demás** es tu texto, con retoques mínimos.

**Opcional para el bloque 6:** si es cierto y pueden citarlo, añade un premio, por ejemplo «It won HackCorruption 2024». Un premio da más credibilidad que cualquier adjetivo. Confírmalo antes, porque yo no lo he verificado para este proyecto.

### Confirmar antes de grabar
- **Cifras:** «ten countries», «almost fifty thousand contracts» y «three languages» tienen que coincidir con la plataforma en vivo el día que la vea el jurado. El video animado de octubre usaba otras cifras: 8 países y 34.212 contratos.
- **Idioma:** debe ser el mismo de la solicitud. Si la solicitud está en español, graben la versión en español.
- **Nombres y roles:** completen los de los tres en `plan_ejemplo.json` (lower_third).

## Cómo grabar (cada bloque es una toma aparte)
- **Formato:** horizontal (16:9), móvil apoyado a la altura de los ojos, 1080p o 4K. En vertical, YouTube podría tratarlo como Short y te descalificarían.
- **Encuadre:** fondo claro y liso, luz de frente (una ventana delante, no detrás) y plano de pecho hacia arriba.
- **Sonido:** micrófono de solapa o el móvil a un metro como máximo, en una habitación sin eco.
- **Cada toma:** un segundo de silencio, el texto, otro segundo de silencio. Si te equivocas, empieza la toma otra vez. El editor recorta los silencios del principio y del final.
- **Nombres de archivo:** `1_A_problema.mp4`, `2_B_producto.mp4`, `3_C_unico.mp4`, `4_A_potencial.mp4`, `5a_A_quien.mp4`, `5b_B_quien.mp4`, `5c_C_quien.mp4`, `6_C_equipo.mp4`, `7_todos.mp4` (los tres juntos en el encuadre). Todos van en una carpeta `tomas/`.

## Montaje
```
python3 editar_pitch.py plan_ejemplo.json contractor-ai-pitch.mp4
```
- **Qué hace:** recorta los silencios de cada toma y pone el rótulo de nombre y rol la primera vez que aparece cada persona. Añade los textos cortos de `callouts` (fijos, sin animación), une las tomas, añade la tarjeta final, nivela el audio para YouTube y exporta a 1920x1080.
- **Límite de duración:** si el resultado pasa de 90 s, avisa y termina con error.
- **Textos en pantalla:** si prefieren que no haya ninguno, borren los `callouts` del plan. Así queda solo con los rótulos de nombre.

## Subir a YouTube (requisitos de la convocatoria)
- **Visibilidad:** pública, no oculta ni privada, y que siga así durante toda la evaluación.
- **Formato:** horizontal y de 90 s como máximo, para que no sea un Short.
- **Fecha:** la fecha de subida se ve en la página del video. No lo borres ni lo vuelvas a subir después de enviar el enlace.
- **Título:** «Contractor AI – Pitch (90 s)». En la descripción, el enlace a la plataforma.
