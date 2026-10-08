# Ciento veinte días

Explicador animado en collage de papel, vertical 9:16, ~94 s, en español, con voz
incrustada y música. Archivo autónomo: `meridian.html` (SVG + CSS + JS, sin imágenes
externas). Vídeo: `meridian-es.mp4`.

## Guion (8 escenas + fuentes)

1. **120 días** — El 30 de septiembre el Pentágono anunció el Proyecto Meridian: un estudio
   de 120 días sobre cómo será la guerra. El informe se espera para finales de enero.
2. **Tres** — Lo colideran Elon Musk, Palmer Luckey y Newt Gingrich. Ninguno de los tres ha
   servido en el ejército estadounidense.
3. **No manda** — No va a escribir estrategias ni políticas: solo señalar qué dominios hay
   que ganar. El análisis lo redacta MITRE.
4. **Hasta la Luna** — El encargo va del subsuelo al espacio cislunar, y nombra IA,
   autonomía, energía dirigida, robótica y biotecnología.
5. **2012** — Lo de los videojuegos no es secreto ni nuevo: el FBI licenció Unreal Engine en
   2012 para entrenar escenas del crimen, y hoy Lockheed construye su simulador con ese motor.
6. **Los dos** — Musk dirige SpaceX, que se llevó 5 de los 7 lanzamientos de seguridad
   nacional del año. Luckey cofundó Anduril, que hace los sistemas autónomos.
7. **2.900 M** — Días después del nombramiento, Anduril ganó un contrato naval de hasta
   2.900 millones. «Aquí no hay nada que ver», dijo el Pentágono; el Congreso dijo que lo
   va a mirar.
8. **Los contratos** — Anduril todavía no es el mayor proveedor: 4.300 millones frente a
   26.800 de Lockheed. Un informe no cambia la ley; los contratos sí.

## Reglas de tratamiento

- **No se dibuja la cara de ninguna persona real.** Los tres colíderes son tres sillas
  vacías con su nombre en un cartel.
- **No se reproduce ningún logotipo ni sello oficial**, ni el del Departamento.
- El vídeo **no dice** que nadie haya «tomado el control del Pentágono»: lo dice
  explícitamente en la escena 1. Es un informe consultivo que redacta MITRE.
- Sobre el contrato de la escena 7 se dice lo que está probado —la cronología— y se deja
  en pantalla que **nadie ha probado nada**: no hay ninguna conclusión formal de conflicto
  de intereses.

## Correcciones respecto al relato de origen

| Afirmación de origen | Lo verificado |
| --- | --- |
| «dueño de **Anthropic** Industries» | **Anduril** Industries, que cofundó en 2017. Anthropic es otra empresa y no tiene relación con esto |
| «fundador de **Opus** VR» | **Oculus** VR |
| «ya tomó el control del Pentágono» | Es un estudio de 120 días que, según el propio anuncio, no produce estrategias ni políticas; el análisis lo hace MITRE |
| «coliderado por Musk y Luckey» | Son tres: Musk, Luckey y **Newt Gingrich**. Lo supervisa el jefe de tecnología del Pentágono |
| «contratos secretos con Epic Games y Nvidia desde 2020; FBI» | El FBI y el ejército licenciaron Unreal Engine en **2012**, en público, a través de la Unreal Government Network. Ni secreto, ni 2020, ni Nvidia. Fortnite es de 2017, así que lo de «las físicas de Fortnite» va al revés |
| «Anduril es su proveedor actual más importante» | Anduril proyecta 4.300 M $ de ingresos en 2026; solo en aeronáutica, Lockheed sumó 26.800 M $ en obligaciones federales del año fiscal 2026 |

Un dato que el relato de origen no tiene y que es el verdadero titular: **días después del
nombramiento, Anduril ganó un contrato naval de hasta 2.900 M $** para un astillero de
piezas de submarinos Virginia.

## Datos verificados

| Dato | Fuente |
| --- | --- |
| El anuncio | 30 de septiembre de 2026, State of the Force en la base de Quantico; estudio de 120 días, informe público con anexo clasificado |
| Los colíderes | Elon Musk, Palmer Luckey y Newt Gingrich; ninguno ha servido en el ejército estadounidense |
| Quién lo redacta | MITRE, por encargo de Emil Michael, jefe de tecnología del Pentágono, con salvaguardas de conflicto de intereses |
| El alcance | Del subsuelo al espacio cislunar; IA, autonomía, energía dirigida, robótica y biotecnología |
| El motor de videojuegos | Epic licenció Unreal Engine al FBI y a otras agencias en 2012 vía Virtual Heroes; Lockheed desarrolla hoy su Future Simulation Engine sobre ese motor |
| Lanzamientos | SpaceX se llevó 5 de las 7 misiones NSSL del año fiscal 2026; también los grandes contratos de constelaciones de la Space Force |
| El contrato | Hasta 2.900 M $ de la Marina (6 de octubre de 2026), días después del nombramiento; el comité de Fuerzas Armadas de la Cámara dijo que examinará la adjudicación |
| El tamaño | Anduril proyecta 4.300 M $ de ingresos en 2026; Lockheed, 26.800 M $ en obligaciones federales de aeronáutica del año fiscal 2026 |

## Producción

```
GEMINI_API_KEY=... python3 narrate.py --spec sections-es.json --audio audio-es   # Gemini TTS, voz Charon
python3 build.py
node rec.mjs out/frames.mp4 meridian.html
ffmpeg ... -i out/frames.mp4 -i out/mix.m4a ... meridian-es.mp4
```

Nota: esta versión se narró con el respaldo local (`voice.py`, Kokoro) porque la clave de
Gemini no estaba disponible en el entorno.
