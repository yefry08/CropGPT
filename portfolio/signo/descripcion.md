# El signo que lo invirtió todo

**Título sugerido:** El error de signo que convirtió a GPT-2 en lo contrario de lo que querían (OpenAI, 2019)

**Descripción:**
En 2019, OpenAI entrenaba a GPT-2 con aprendizaje por preferencias humanas (RLHF): evaluadores puntuaban respuestas y con esas notas se entrenaba un modelo de recompensa. Las instrucciones pedían dar la nota más baja al contenido sexualmente explícito. Al reorganizar el código, una refactorización invirtió el signo de la recompensa (y también el de la penalización KL), así que el sistema pasó a perseguir justo lo que debía evitar. El entrenamiento corrió de noche y, por la mañana, el resultado no era texto sin sentido: era lo máximamente malo según esas instrucciones. Lo detuvieron.

El propio artículo de OpenAI lo documenta en la sección 4.4, «Bugs can optimize for bad behavior», y lo usa como ejemplo de desalineación externa: el sistema no se rebeló, cumplió exactamente el objetivo mal especificado.

Matiz importante: la versión popular de que «se borró un signo menos» es una reconstrucción divulgativa (LessWrong, 2024). OpenAI nunca publicó la línea exacta del código; lo que sí dice el artículo es que el signo de la recompensa quedó invertido.

Aviso: voz y animación generadas con IA. Ilustraciones, no imágenes reales. En pantalla no se muestra ningún contenido explícito: aparece censurado en bloques.

**Fuentes:**
- Ziegler et al., *Fine-Tuning Language Models from Human Preferences* (2019), §4.4: https://arxiv.org/pdf/1909.08593
- OpenAI, *Fine-tuning GPT-2 from human preferences* (2019): https://openai.com/index/fine-tuning-gpt-2/
- Relato divulgativo (no confirmado por OpenAI): https://www.lesswrong.com/posts/xD3wymX24BpqezBpw/the-true-story-of-how-gpt-2-became-maximally-lewd

**Etiquetas:** IA, RLHF, alineación, OpenAI, GPT-2, seguridad en IA, aprendizaje por refuerzo, desalineación

**Contenido sintético:** sí (voz y animación generadas con IA).

**Caption:** Un signo invertido en el código y el modelo empezó a perseguir justo lo que debía evitar. La alineación también falla por cosas aburridas. ➖ #IA #RLHF #SeguridadIA #OpenAI #Alineación
