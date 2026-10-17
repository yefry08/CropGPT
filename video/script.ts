// Narration script, split into subtitle cues. English is the founder's script verbatim;
// Spanish is a faithful translation. Both lists must have the same number of cues per scene.
// burn: false marks cues whose text is already on screen as a big figure (kept in the .srt only).

export type Cue = { en: string; es: string; burn?: boolean };

export const SCENES: { id: string; cues: Cue[] }[] = [
  {
    id: "problem",
    cues: [
      {
        en: "Public procurement data is open by law across Latin America.",
        es: "Los datos de compras públicas son abiertos por ley en toda América Latina.",
      },
      {
        en: "But it is too technical for the people who need it most:",
        es: "Pero son demasiado técnicos para quienes más los necesitan:",
      },
      {
        en: "small businesses bidding on contracts, and citizens asking where their money goes.",
        es: "pequeñas empresas que compiten por contratos y ciudadanos que preguntan a dónde va su dinero.",
      },
    ],
  },
  {
    id: "solution",
    cues: [
      {
        en: "Contractor AI reads government contracts",
        es: "Contractor AI lee contratos gubernamentales",
      },
      {
        en: "and flags prices far above similar past contracts.",
        es: "y señala precios muy por encima de contratos similares anteriores.",
      },
      {
        en: "Each alert shows the buyer, the category, and the contract detail,",
        es: "Cada alerta muestra el comprador, la categoría y el detalle del contrato,",
      },
      {
        en: "and it is framed as 'warrants review', never as a verdict.",
        es: "y se presenta como «amerita revisión», nunca como un veredicto.",
      },
    ],
  },
  {
    id: "demo",
    cues: [
      { en: "Search by country, buyer, or category.", es: "Busca por país, comprador o categoría." },
      { en: "Filter to the anomalies already detected.", es: "Filtra las anomalías ya detectadas." },
      {
        en: "Open any alert and see the evidence behind it, not just a score.",
        es: "Abre cualquier alerta y ve la evidencia que la respalda, no solo una puntuación.",
      },
    ],
  },
  {
    id: "ai",
    cues: [
      {
        en: "A multilingual language model reads each contract description",
        es: "Un modelo de lenguaje multilingüe lee la descripción de cada contrato",
      },
      { en: "to find truly comparable purchases.", es: "para encontrar compras realmente comparables." },
      { en: "A separate statistical layer checks every country.", es: "Una capa estadística independiente revisa cada país." },
      { en: "When both signals agree, the alert is stronger.", es: "Cuando ambas señales coinciden, la alerta es más sólida." },
      { en: "A person always makes the final decision.", es: "Una persona siempre toma la decisión final." },
    ],
  },
  {
    id: "traction",
    // Figure cues are filled in from the live counters (or the script figures) in timeline.ts.
    cues: [
      { en: "{countries} countries with live data.", es: "{countries} países con datos en vivo.", burn: false },
      { en: "{contracts} contracts ingested.", es: "{contracts} contratos ingeridos.", burn: false },
      { en: "{anomalies} open anomalies.", es: "{anomalies} anomalías abiertas.", burn: false },
      {
        en: "{historical} million historical contracts used to validate the model.",
        es: "{historical} millones de contratos históricos usados para validar el modelo.",
        burn: false,
      },
      {
        en: "Recognized by the Organization of American States.",
        es: "Reconocido por la Organización de los Estados Americanos.",
      },
    ],
  },
  {
    id: "close",
    cues: [
      {
        en: "Transparency should not depend on expensive tools or specialized knowledge.",
        es: "La transparencia no debería depender de herramientas costosas ni de conocimiento especializado.",
      },
      { en: "I'm Yefry Núñez, and this is Contractor AI.", es: "Soy Yefry Núñez, y esto es Contractor AI." },
    ],
  },
];
