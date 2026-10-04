"""Spanish narrated build: translates black-box.html, times scenes to the Gemini voice,
mixes voice + score, embeds the audio, and writes black-box-es.html + out/mix-es.m4a."""
import base64, json, subprocess, wave
LEAD, TR, MIN, END = 0.5, 0.8, 8.5, 7.0
ids = [s["id"] for s in json.load(open("sections-es.json"))["sections"]]
durs = []
for i in ids:
    with wave.open(f"audio-es/{i}.wav") as w: durs.append(w.getnframes() / w.getframerate())
scene = [max(MIN, v + LEAD + 1.0) for v in durs] + [END]
starts, acc = [], 0
for k, d in enumerate(scene):
    st = acc - TR if k else 0; starts.append(st); acc = st + d
total = acc
json.dump({"total": total, "starts": starts}, open("out/starts-es.json", "w"))
subprocess.run(["python3", "score.py", "out/starts-es.json", "out/score-es.wav"], check=True)
inp, flt = ["-i", "out/score-es.wav"], ["[0:a]volume=0.32[m]"]
for k, i in enumerate(ids):
    inp += ["-i", f"audio-es/{i}.wav"]; ms = int((starts[k] + LEAD) * 1000)
    flt.append(f"[{k+1}:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[v{k}]")
flt.append("".join(f"[v{k}]" for k in range(len(ids))) + f"amix=inputs={len(ids)}:normalize=0[vo]")
flt.append("[vo][m]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(flt), "-map", "[out]",
                "-t", f"{total:.3f}", "-c:a", "aac", "-b:a", "112k", "-ar", "44100", "out/mix-es.m4a"], check=True)

s = open("black-box.html", encoding="utf-8").read()
R = [
 ('<html lang="en">', '<html lang="es">'), ('<title>The Black Box</title>', '<title>La caja negra</title>'),
 ('content="A 9:16 paper-collage explainer: why nobody can fully explain how neural networks decide."', 'content="Explicador en collage de papel 9:16: por qué nadie puede explicar del todo cómo deciden las redes neuronales."'),
 ('aria-label="Animated explainer: The Black Box"', 'aria-label="Explicador animado: La caja negra"'),
 ('.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")', '.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".")'),
 ('word: "Why?"', 'word: "¿Por qué?"'), ('text: "MOVE 37"', 'text: "JUGADA 37"'),
 ('cap: ["In 2016, AlphaGo made a move it judged a human would play only 1 in 10,000 times, and won.", "Nobody could fully say why."]',
  'cap: ["En 2016, AlphaGo hizo una jugada que, según sus propios cálculos, un humano haría solo 1 de cada 10.000 veces. Y ganó.", "Nadie supo explicar del todo por qué."]'),
 ('T(cl, "1 in", 156, 280', 'T(cl, "1 de cada", 156, 280'), ('"AlphaGo’s own estimate"', '"cálculo del propio AlphaGo"'),
 ('top: "SEOUL 2016"', 'top: "SEÚL 2016"'),
 ('word: "Rules"', 'word: "Reglas"'), ('text: "WHO?", x: 790', 'text: "¿QUIÉN?", x: 700'),
 ('cap: ["Normal software follows rules a person wrote.", "A neural network learns its own, spread across billions of numbers: GPT-3 had 175 billion."]',
  'cap: ["El software normal sigue reglas que escribió una persona.", "Una red neuronal aprende las suyas, repartidas en miles de millones de números: GPT-3 tenía 175.000 millones."]'),
 ('["IF  temp > 30", "THEN  fan = ON", "ELSE  fan = OFF"]', '["SI  temp > 30", "ENTONCES  vent = ON", "SI NO  vent = OFF"]'),
 ('"parameters in GPT-3 (2020)"', '"parámetros de GPT-3 (2020)"'),
 ('word: "Gibbon?"', 'word: "¿Gibón?"'), ('text: "NOISE"', 'text: "RUIDO"'),
 ('cap: ["Add noise too faint for us to see,", "and a network will call a panda a gibbon with 99.3% confidence."]',
  'cap: ["Añade un ruido tan leve que no lo vemos,", "y una red dirá que un panda es un gibón, con un 99,3 % de confianza."]'),
 ('"THE AI SEES:"', '"LA IA VE:"'),
 ('const pct = T(flip, "57.7%"', 'const pct = T(flip, "57,7 %"'),
 ('pct.textContent = "57.7%"; }', 'pct.textContent = "57,7 %"; }'),
 ('word.textContent = "gibbon"; pct.textContent = lerp(57.7, 99.3, eo(seg(t, 5.1, 6.4))).toFixed(1) + "%";',
  'word.textContent = "gibón"; pct.textContent = lerp(57.7, 99.3, eo(seg(t, 5.1, 6.4))).toFixed(1).replace(".", ",") + " %";'),
 ('const note = T(an, "still a panda to us", 1050, 1388', 'const note = T(an, "sigue siendo un panda", 1050, 1442'),
 ('word: "Inside", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -150', 'word: "Por dentro", wordColor: INK, cx: 540, cy: 600, size: 300, maxW: 820, wx: -60'), ('text: "FEATURES"', 'text: "RASGOS"'),
 ('cap: ["Researchers now take models apart like brains.", "One team found a “Golden Gate Bridge” feature, and turning it up made the model talk about nothing else."]',
  'cap: ["Hoy los investigadores desarman modelos como si fueran cerebros.", "Un equipo encontró un rasgo del puente Golden Gate, y al subirlo, el modelo no hablaba de otra cosa."]'),
 ('pix(dl, "STRENGTH"', 'pix(dl, "INTENSIDAD"'),
 ('T(sp, "“I am the Golden", 350, 270', 'T(sp, "«Soy el puente", 350, 270'), ('T(sp, "Gate Bridge…”", 350, 335', 'T(sp, "Golden Gate…»", 350, 335'),
 ('text: "SUDDEN"', 'text: "DE GOLPE"'),
 ('cap: ["Some networks memorize for ages, then suddenly understand.", "Even their builders can’t predict when."]',
  'cap: ["Algunas redes memorizan durante mucho tiempo y, de repente, entienden.", "Ni sus creadores pueden predecir cuándo."]'),
 ('T(cl, "accuracy", 150', 'T(cl, "acierto", 150'), ('"training time →"', '"entrenamiento →"'),
 ('T(cl, "seen data", 274', 'T(cl, "datos vistos", 274'), ('T(cl, "new data", 484', 'T(cl, "datos nuevos", 524'), ('{ x1: 432, y1: 1318, x2: 472,', '{ x1: 472, y1: 1318, x2: 512,'),
 ('T(cl, "memorize", 310', 'T(cl, "memoriza", 310'), ('T(cl, "understand", 728', 'T(cl, "entiende", 728'), ('T(cl, "aha!", 560', 'T(cl, "¡ajá!", 545'),
 ('text: "RULE 30"', 'text: "REGLA 30"'),
 ('cap: ["Stephen Wolfram argues some processes have no shortcut:", "the only way to know the outcome is to run every step."]',
  'cap: ["Stephen Wolfram sostiene que algunos procesos no tienen atajo:", "la única forma de saber el resultado es ejecutar cada paso."]'),
 ('"no shortcut: you have to run it"', '"sin atajos: hay que ejecutarlo"'),
 ('word: "Stories"', 'word: "Relatos"'), ('text: "INTERPRETER"', 'text: "INTÉRPRETE"'),
 ('cap: ["Our brains are black boxes too.", "Split-brain patients confidently invented reasons for choices they never knowingly made."]',
  'cap: ["Nuestro cerebro también es una caja negra.", "Pacientes con el cerebro dividido inventaban, muy seguros, razones para decisiones que no sabían que habían tomado."]'),
 ('"“You need a shovel to clean".split(" "), s2 = "out the chicken shed!”".split(" ")', '"«Necesitas una pala para".split(" "), s2 = "limpiar el gallinero»".split(" ")'),
 ('word: "Explain"', 'word: "Explicar"'),
 ('cap: ["From December 2027, EU law gives people a right to an explanation when high-risk AI decides about them.", "We built it before we understood it."]',
  'cap: ["Desde diciembre de 2027, la ley de la UE da derecho a una explicación cuando una IA de alto riesgo decide sobre ti.", "Lo construimos antes de entenderlo."]'),
 ('T(g, "ARTICLE 86"', 'T(g, "ARTÍCULO 86"'), ('"Right to explanation of"', '"Derecho a explicación de las"'),
 ('"individual decision-making"', '"decisiones individuales"'),
 ('T(seal, "APPLIES"', 'T(seal, "SE APLICA"'), ('T(seal, "2 DEC"', 'T(seal, "2 DIC"'),
 ('pix(cl, "FROM"', 'pix(cl, "DESDE"'), ('"DEC 2024"', '"DIC 2024"'), ('yr.textContent = "DEC "', 'yr.textContent = "DIC "'),
 ('"pushed back from Aug 2026"', '"aplazado desde agosto de 2026"'),
 ('tr: "left", dur: 8.5,', 'tr: "left", dur: END_DUR,'),
 ('word: "Sources"', 'word: "Fuentes"'), ('text: "FACT-CHECKED"', 'text: "VERIFICADO"'),
 ('"AlphaGo vs Lee Sedol, game 2, move 37"', '"AlphaGo vs. Lee Sedol, partida 2, jugada 37"'),
 ('"Scaling Monosemanticity (Golden Gate feature)"', '"Scaling Monosemanticity (rasgo Golden Gate)"'),
 ('"A New Kind of Science (irreducibility)"', '"A New Kind of Science (irreducibilidad)"'),
 ('"The Integrated Mind (the interpreter)"', '"The Integrated Mind (el intérprete)"'),
 ('"EU AI Act, Art. 86 + AI Omnibus, 2026", "Right to explanation, applies 2 Dec 2027"', '"Ley de IA de la UE, art. 86 + Ómnibus, 2026", "Derecho a explicación, desde el 2 dic 2027"'),
 ('"Illustrations, not real images. Animation made with AI."', '"Ilustraciones, no imágenes reales. Voz y animación hechas con IA."'),
 ('aria-label="Pause"', 'aria-label="Pausa"'), ('aria-label="Restart"', 'aria-label="Reiniciar"'), ('aria-label="Progress"', 'aria-label="Progreso"'),
]
for a, b in R:
    assert s.count(a) == 1, a; s = s.replace(a, b)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "out/mix-es.m4a", "-c:a", "libmp3lame", "-b:a", "112k", "out/mix-es.mp3"], check=True)
audio = base64.b64encode(open("out/mix-es.mp3", "rb").read()).decode()
s = s.replace("END_DUR", str(END))
inject = f'<script>window.VOICE = {{ lead: {LEAD}, durs: {json.dumps([round(d, 3) for d in durs])}, audio: "data:audio/mpeg;base64,{audio}" }};</script>\n<script>\n"use strict";'
assert s.count('<script>\n"use strict";') == 1; s = s.replace('<script>\n"use strict";', inject)
open("black-box-es.html", "w", encoding="utf-8").write(s)
print(f"total {total:.1f} s, voice {sum(durs):.1f} s, html {len(s)/1e6:.2f} MB")
