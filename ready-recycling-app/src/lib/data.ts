// Catálogo de Ready Recycling: categorías de los módulos, red de contenedores de
// demostración, preguntas de la guía de clasificación y premios.

export type CategoryKey = 'plastico' | 'papel' | 'vidrio' | 'metal' | 'organico';

export type Category = {
  key: CategoryKey;
  name: string;
  color: string;
  mouth: string; // forma de la boca de entrada (preclasificación)
  icon: string; // nombre de Ionicons
  examples: string[];
  tip: string;
  kgPerLitre: number; // densidad aparente de los residuos sueltos
  pointsPerUnit: number;
  gramsPerUnit: number; // peso típico de una unidad
};

export const CATEGORIES: Record<CategoryKey, Category> = {
  plastico: {
    key: 'plastico',
    gramsPerUnit: 20,
    name: 'Plástico',
    color: '#D9A521',
    mouth: 'Boca redonda',
    icon: 'water-outline',
    examples: ['Botellas PET', 'Envases de detergente', 'Tapas plásticas', 'Fundas limpias'],
    tip: 'Vacía y aplasta la botella. Deja la tapa puesta para que no se pierda.',
    kgPerLitre: 0.017,
    pointsPerUnit: 2,
  },
  papel: {
    key: 'papel',
    gramsPerUnit: 60,
    name: 'Papel y cartón',
    color: '#2F6FC4',
    mouth: 'Ranura',
    icon: 'document-text-outline',
    examples: ['Periódicos', 'Cajas de cartón dobladas', 'Hojas y cuadernos', 'Revistas'],
    tip: 'Dobla las cajas y mantén el papel seco y sin grasa.',
    kgPerLitre: 0.09,
    pointsPerUnit: 1,
  },
  vidrio: {
    key: 'vidrio',
    gramsPerUnit: 300,
    name: 'Vidrio',
    color: '#2F8A4E',
    mouth: 'Boca con aletas',
    icon: 'wine-outline',
    examples: ['Botellas de vidrio', 'Frascos', 'Envases de salsa'],
    tip: 'Sin tapas ni corchos. Los espejos y bombillos no van aquí.',
    kgPerLitre: 0.3,
    pointsPerUnit: 3,
  },
  metal: {
    key: 'metal',
    gramsPerUnit: 15,
    name: 'Metal',
    color: '#B83A30',
    mouth: 'Boca pequeña',
    icon: 'beer-outline',
    examples: ['Latas de refresco', 'Latas de conserva', 'Tapas metálicas', 'Papel de aluminio limpio'],
    tip: 'Enjuaga las latas y aplástalas para ahorrar espacio.',
    kgPerLitre: 0.06,
    pointsPerUnit: 3,
  },
  organico: {
    key: 'organico',
    gramsPerUnit: 150,
    name: 'Orgánico',
    color: '#7D4F2A',
    mouth: 'Compuerta',
    icon: 'leaf-outline',
    examples: ['Cáscaras de frutas', 'Restos de comida', 'Hojas y poda', 'Borra de café'],
    tip: 'Sin fundas plásticas: se convierte en abono para la industria agrícola.',
    kgPerLitre: 0.45,
    pointsPerUnit: 1,
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export type Connectivity = 'Wi-Fi' | 'LoRaWAN' | '4G';

export type Site = {
  id: string;
  name: string;
  place: string;
  lat: number;
  lng: number;
  connectivity: Connectivity;
  solar: boolean;
  modules: CategoryKey[];
};

// Red de demostración basada en los aliados del proyecto (MINERD Espaillat, ADASEC, DIA Lab).
export const SITES: Site[] = [
  { id: 'dia-lab', name: 'DIA Lab RD', place: 'Santo Domingo, Distrito Nacional', lat: 18.4719, lng: -69.9312, connectivity: 'Wi-Fi', solar: false, modules: ['plastico', 'papel', 'vidrio', 'metal', 'organico'] },
  { id: 'adasec-sd', name: 'ADASEC — Oficina principal', place: 'Santo Domingo Este', lat: 18.4896, lng: -69.8573, connectivity: 'Wi-Fi', solar: false, modules: ['plastico', 'papel', 'metal'] },
  { id: 'liceo-moca', name: 'Liceo Público de Moca', place: 'Moca, Espaillat', lat: 19.3926, lng: -70.5248, connectivity: 'LoRaWAN', solar: true, modules: ['plastico', 'papel', 'vidrio', 'organico'] },
  { id: 'politecnico-espaillat', name: 'Politécnico Espaillat', place: 'Moca, Espaillat', lat: 19.3871, lng: -70.5182, connectivity: 'LoRaWAN', solar: true, modules: ['plastico', 'papel', 'metal', 'organico'] },
  { id: 'adasec-lab-santiago', name: 'Laboratorio ADASEC', place: 'Santiago de los Caballeros', lat: 19.4517, lng: -70.697, connectivity: '4G', solar: true, modules: ['plastico', 'papel', 'vidrio'] },
  { id: 'parque-villa', name: 'Parque Central', place: 'Villa Altagracia', lat: 18.6718, lng: -70.1712, connectivity: '4G', solar: true, modules: ['plastico', 'metal', 'organico'] },
];

export const COLLECTION_CENTERS = ['Centro de acopio Rizek Ecoservices', 'Centro de acopio Cypel Global', 'Centro de acopio Greenlove'];

// Guía de clasificación guiada por preguntas.
export type Answer = { label: string; go?: string; result?: CategoryKey | 'resto' };
export type Question = { id: string; text: string; answers: Answer[] };

export const QUESTIONS: Record<string, Question> = {
  start: {
    id: 'start',
    text: '¿De qué está hecho principalmente tu residuo?',
    answers: [
      { label: 'Plástico', go: 'plastico' },
      { label: 'Papel o cartón', go: 'papel' },
      { label: 'Vidrio', result: 'vidrio' },
      { label: 'Metal o aluminio', result: 'metal' },
      { label: 'Comida, cáscaras o plantas', result: 'organico' },
      { label: 'No estoy seguro', go: 'unsure' },
    ],
  },
  plastico: {
    id: 'plastico',
    text: '¿Es un envase o botella, o es foam (poliestireno)?',
    answers: [
      { label: 'Botella, envase, tapa o funda limpia', result: 'plastico' },
      { label: 'Foam / anime (vasos, platos)', result: 'resto' },
      { label: 'Está sucio con comida', go: 'dirty' },
    ],
  },
  papel: {
    id: 'papel',
    text: '¿Está limpio y seco?',
    answers: [
      { label: 'Sí, limpio y seco', result: 'papel' },
      { label: 'Tiene grasa o comida (servilletas, caja de pizza)', result: 'organico' },
      { label: 'Es papel plastificado o metalizado', result: 'resto' },
    ],
  },
  dirty: {
    id: 'dirty',
    text: '¿Puedes enjuagarlo rápidamente?',
    answers: [
      { label: 'Sí, lo enjuago', result: 'plastico' },
      { label: 'No', result: 'resto' },
    ],
  },
  unsure: {
    id: 'unsure',
    text: '¿Cuál de estas descripciones se parece más?',
    answers: [
      { label: 'Transparente, duro y se puede romper', result: 'vidrio' },
      { label: 'Es una lata o hace sonido metálico', result: 'metal' },
      { label: 'Se dobla y se rasga con la mano', go: 'papel' },
      { label: 'Es flexible o una botella liviana', go: 'plastico' },
      { label: 'Se descompone (restos de comida)', result: 'organico' },
      { label: 'Pilas, bombillos o electrónicos', result: 'resto' },
    ],
  },
};

export const QUICK_ITEMS: { name: string; result: CategoryKey | 'resto' }[] = [
  { name: 'Botella de agua', result: 'plastico' },
  { name: 'Lata de refresco', result: 'metal' },
  { name: 'Caja de cereal', result: 'papel' },
  { name: 'Frasco de vidrio', result: 'vidrio' },
  { name: 'Cáscara de guineo', result: 'organico' },
  { name: 'Caja de pizza grasienta', result: 'organico' },
  { name: 'Vaso de foam', result: 'resto' },
  { name: 'Periódico', result: 'papel' },
  { name: 'Pila / batería', result: 'resto' },
  { name: 'Envase de yogur', result: 'plastico' },
];

export const NOT_RECYCLABLE = {
  title: 'Zafacón general',
  text: 'Este residuo no va en los módulos Ready. Las pilas, bombillos y electrónicos se llevan a un punto de residuos especiales.',
};

export type Prize = { id: string; name: string; cost: number; icon: string };
export const PRIZES: Prize[] = [
  { id: 'botella', name: 'Botella reutilizable Ready', cost: 150, icon: 'water' },
  { id: 'planta', name: 'Planta para tu aula u oficina', cost: 300, icon: 'leaf' },
  { id: 'taller', name: 'Taller ambiental para tu grupo', cost: 500, icon: 'school' },
  { id: 'kit', name: 'Descuento en kit Ready (3 contenedores)', cost: 1200, icon: 'cube' },
];

// Competencia entre centros educativos (puntos de la temporada, demostración).
export const LEADERBOARD = [
  { name: 'Liceo Público de Moca', points: 4820 },
  { name: 'Politécnico Espaillat', points: 4310 },
  { name: 'Laboratorio ADASEC Santiago', points: 2975 },
  { name: 'DIA Lab RD', points: 1640 },
];

export const WEEKDAYS = [
  { label: 'D', name: 'Domingo', value: 1 },
  { label: 'L', name: 'Lunes', value: 2 },
  { label: 'M', name: 'Martes', value: 3 },
  { label: 'X', name: 'Miércoles', value: 4 },
  { label: 'J', name: 'Jueves', value: 5 },
  { label: 'V', name: 'Viernes', value: 6 },
  { label: 'S', name: 'Sábado', value: 7 },
];
