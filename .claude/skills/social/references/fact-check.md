# Fact layer for /social

Run this before writing a single line of script. A summary of someone else's video is a lead, not a source.

## Verify
- Search each claim (WebSearch). Prefer, in order: the organisations' own posts (company blog, SEC filing,
  official statement), then reputable outlets (Reuters, AP, CNBC, Fortune, The Register, Quanta…), then
  specialist press. Note the date of every source; state the "datos a <fecha>" line in the film and description.
- When sources disagree on a detail (a date, a figure), use the primary source or say "a mediados de…".
- WebFetch is often blocked in the sandbox: rely on search snippets and say so to the user; ask them to
  review the sources before publishing.

## Report back to the user before producing
A short table: what the brief claimed → what the sources say. Typical fixes we have made:
- a model or product name that was never confirmed ("GPT-6") → say what the companies actually said;
- a role misdescribed (an open model "stopped the attack" when it was used for forensics);
- an unconfirmed consequence (deleted repositories) → left out, and say so.

## Allegations against real people or companies
- Label them: "según <persona>", "<persona> afirma…", "relata…". Never state them as fact.
- Give the response of the accused the same weight (same scene length, same card size), including
  apologies, denials and their own version of events.
- Only call something wrongdoing when there is a court ruling, an official audit or multiple reputable
  outlets, and use accurate legal wording ("críticas, demandas y debates abiertos, no condenas").

## Conflicts of interest
If the topic involves Anthropic (the maker of Claude, which makes these films), say so in the narration,
on the end card and in the description.

## Visual honesty
- Never draw a real person: names appear as text or name cards only. No logos.
- Illustrative data (a sample table) is labelled "ejemplo ilustrativo"; no invented metrics.
- End card: "Voz sintética (Gemini TTS) · Animación hecha con IA (Claude) · Ilustración, no imágenes reales".
- Tell the user to tick the platform's AI/synthetic-content disclosure when publishing.
