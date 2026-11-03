export interface FeaturedLocation {
  id: string
  name: string
  region: string
  emoji: string
  lat: number
  lon: number
  radiusKm: number
  note: string
}

/** Ten key agricultural zones of the Dominican Republic. */
export const FEATURED_LOCATIONS: FeaturedLocation[] = [
  {
    id: "cibao-central",
    name: "Valle del Cibao",
    region: "Santiago / La Vega",
    emoji: "🌾",
    lat: 19.45,
    lon: -70.7,
    radiusKm: 4,
    note: "Principal zona de producción alimentaria — arroz, maíz, plátano, hortalizas",
  },
  {
    id: "constanza",
    name: "Constanza",
    region: "La Vega",
    emoji: "🥦",
    lat: 18.91,
    lon: -70.74,
    radiusKm: 3,
    note: "Producción de vegetales de altura (papa, zanahoria, ajo) a ~1 200 m.s.n.m.",
  },
  {
    id: "azua",
    name: "Llano de Azua",
    region: "Azua",
    emoji: "🌵",
    lat: 18.45,
    lon: -70.73,
    radiusKm: 4,
    note: "Agricultura de riego en zona semiárida — melón, tomate, yuca",
  },
  {
    id: "barahona",
    name: "Barahona Sur",
    region: "Barahona",
    emoji: "🍌",
    lat: 18.2,
    lon: -71.1,
    radiusKm: 4,
    note: "Caña de azúcar, banano y café de altura en la Sierra de Bahoruco",
  },
  {
    id: "samana",
    name: "Samaná",
    region: "Samaná",
    emoji: "🥥",
    lat: 19.2,
    lon: -69.33,
    radiusKm: 3,
    note: "Cacao fino, coco y achiote en zona húmeda tropical",
  },
  {
    id: "monte-plata-norte",
    name: "Monte Plata",
    region: "Monte Plata",
    emoji: "🌿",
    lat: 18.8,
    lon: -69.78,
    radiusKm: 4,
    note: "Agricultura tropical de mediana altitud — cacao, café, ganadería",
  },
  {
    id: "san-jose-ocoa",
    name: "San José de Ocoa",
    region: "San José de Ocoa",
    emoji: "☕",
    lat: 18.54,
    lon: -70.51,
    radiusKm: 3,
    note: "Café de altura, hortalizas y sistemas agroforestales en sierra",
  },
  {
    id: "valverde-mao",
    name: "Valverde / Mao",
    region: "Valverde",
    emoji: "🌿",
    lat: 19.56,
    lon: -71.08,
    radiusKm: 4,
    note: "Arroz irrigado, tabaco rubio y producción de banano de exportación",
  },
  {
    id: "neyba-enriquillo",
    name: "Neiba / Lago Enriquillo",
    region: "Baoruco",
    emoji: "🍇",
    lat: 18.49,
    lon: -71.41,
    radiusKm: 4,
    note: "Viticultura en zona de muy baja precipitación — uvas y mangos de exportación",
  },
  {
    id: "hato-mayor",
    name: "Hato Mayor",
    region: "Hato Mayor",
    emoji: "🐄",
    lat: 18.76,
    lon: -69.26,
    radiusKm: 4,
    note: "Ganadería bovina extensiva y producción de cacao en suelo de sabana",
  },
]
