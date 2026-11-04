# Una IA operó el cerebro de otra IA sin reentrenarla

**Texto para publicar:**
Investigadores del MIT usaron GPT-6 Astra para leer y editar directamente los pesos de otras redes, sin reentrenarlas. Identificó juegos solo mirando números, reparó un coche simulado cambiando el 3,5 % de sus pesos y sacó a Qwen de un bucle: del 8 % al 48 % de aciertos en matemáticas tocando el 0,02 % de los pesos. Ojo: no lo hizo más listo, le quitó el freno de mano, y aún no hay revisión por pares. ¿Quién revisa a la IA que edita? #InteligenciaArtificial #MIT #OpenAI #Qwen #IA

Voz sintética de Piper (código abierto). Animación hecha con código; ilustraciones genéricas, sin personas reales.

**Qué verificamos:**

| Se decía | Lo que dicen las fuentes |
|---|---|
| Investigadores del MIT usaron GPT-6 Astra para mejorar otra IA sin reentrenarla | Confirmado: cuatro investigadores de MIT CSAIL (Takehi, Teoh, Zhang y Khattab) lo publicaron el 2-11-2026 en un blog, sin revisión por pares. Matiz: Astra pudo hacer hasta 50 pasadas de evaluación, así que no fue 'a ciegas'. |
| El proceso se llama 'Chispas' | No encontrado: los autores lo llaman Weight-Space Programming (programación en el espacio de pesos). |
| La IA identificó qué tareas hacían modelos pequeños solo con sus pesos | Confirmado: identificó cuatro redes con la misma arquitectura como Breakout, Pong, Pac-Man y Freeway, sin herramientas ni lista de opciones. Falló al distinguir un modelo complaciente de uno correcto hasta que le dieron mediciones de atención. |
| Reparó un coche atascado en una rampa modificando el 3,5 % de los pesos | Confirmado: era un controlador de conducción simulado; el parche cambió el 3,5 % de los pesos y alcanzó un 100 % de éxito. |
| Fabricó redes desde cero que jugaban mejor que modelos entrenados | Parcial: en Breakout (MinAtar) sacó 517,4 frente a 25,3 de una red PPO con 500 millones de pasos; en Seaquest y Asterix quedó por detrás de esas redes, aunque superó a las de 100 millones de pasos. |
| Eliminó un bucle infinito de Qwen y aumentó drásticamente su eficacia | Confirmado: Qwen3.5-0.8B pasó de 7,9 % a 48,1 % en MATH-500 (y de 13,8 % a 67,1 % en GSM8K) editando el 0,016 % de los pesos (131.072). La mejora viene de reducir la repetición, no de más conocimiento; en Gemma 3 270M, sin ese bucle, no mejoró. |
| No es el fin del entrenamiento: quita el freno de mano | Confirmado por los propios autores: editar pesos puede quitar un obstáculo que ocultaba una capacidad, pero no añadir una que el modelo no tenga. Falta replicación independiente y comparación con métodos como ROME o MEMIT. |

**Fuentes:**
- VentureBeat: 'Like gene editing for neural networks': https://venturebeat.com/technology/like-gene-editing-for-neural-networks-mit-researchers-used-gpt-6-astra-to-edit-qwens-open-weights-directly-boosting-math-performance
- Digit: MIT researchers show LLMs can edit neural network weights without training: https://www.digit.in/features/general/mit-researchers-show-llms-can-edit-neural-network-weights-without-training-heres-what-it-means.html
- Latent Space: LLMs can read & write neural network weights: https://latent.space/p/ainews-llms-can-read-write-neural-network-weights-weight-space-programming-cuts-autoresearch-out-of/
- AI Front Page: GPT-6 Astra edits neural network weights: https://aifront-page.com/mit-weight-space-programming-gpt-6-astra/

**Contenido sintético:** sí (la voz). Marca la casilla de contenido generado con IA al publicar.
