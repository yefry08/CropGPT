# Contractor AI · MVP walkthrough (≤120 s, English)

Live screen recording of the real platform, in real time. No slides, no animations, no sales pitch.

## What the current 1-minute demo is missing
| Requirement | Current video (Contractor_AI_1min_DEMO.mp4) |
|---|---|
| User journey from start to finish | It opens "Analizar un contrato" but never uploads or analyses a contract (steps 2–4 never run). |
| 2–3 core functionalities working in real time | Shows the anomaly list, the dashboard and the map, but no single result is opened and explained. |
| Current state of development | Not stated. |
| The part of the technology that solves the problem | It says "AI model"; the screen says the verdict is "100% statistical (median + MAD), no AI", with an optional AI summary. Say it the way the product does. |
| Clean audio and text | The burned-in captions say "Jeffy Nuno", "Contractors AI" and "OpenDataPIDA"; the audio has "Did you pause it?"; the last 3 s are black; the audio is quiet. |

## Shot list (about 110 s)
| s | Screen | Narration |
|---|---|---|
| 0–10 | Home page | Contractor AI is a working web platform that flags unusual prices in public procurement. Here is the full user journey on the live product. |
| 10–40 | Analizar contratos → Subir PDF (or Pegar link) → country → Continuar → Confirmar → Resultado | A user uploads a contract, or pastes the link to its official publication, and picks the country. We extract the item and price, then compare it with similar contracts already ingested for that country. |
| 40–60 | The result: price vs. median, the deviation, the comparable contracts | This is the core: a robust statistical test, median and MAD, on comparable contracts. Here the price is X times the typical one, so it is flagged, and every comparable contract links to its official source. The AI summary is optional and comes last. |
| 60–80 | Anomalías detectadas: filter by country, open one alert | Second, the anomaly feed: every contract we ingest is scored the same way. You can filter by country and buyer and open the evidence behind each alert. |
| 80–100 | Panel and the contracting map | Third, the institutional dashboard and the map of who buys from whom, to spot concentrated suppliers. |
| 100–115 | Home counters | Current state: a functional product, live and free, with 15,473 contracts from 4 OCDS countries (use the live numbers). Next: more countries and municipal needs data. |

Language: the platform's interface is in Spanish; the narration is in English. If the site has an English toggle ("ES" at the top right), switch to EN before recording.
