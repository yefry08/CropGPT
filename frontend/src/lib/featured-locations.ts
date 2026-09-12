export interface FeaturedLocation {
  id: string
  name: string
  country: string
  emoji: string
  lat: number
  lon: number
  radiusKm: number
  note: string
}

export const FEATURED_LOCATIONS: FeaturedLocation[] = [
  {
    id: "gaza-strip",
    name: "Gaza Strip",
    country: "Palestine",
    emoji: "🇵🇸",
    lat: 31.35,
    lon: 34.3,
    radiusKm: 3,
    note: "Coastal Mediterranean smallholder zone",
  },
  {
    id: "lower-shabelle",
    name: "Lower Shabelle",
    country: "Somalia",
    emoji: "🇸🇴",
    lat: 1.85,
    lon: 44.7,
    radiusKm: 5,
    note: "Agropastoral flood-recession farming",
  },
  {
    id: "wadi-hadhramaut",
    name: "Wadi Hadhramaut",
    country: "Yemen",
    emoji: "🇾🇪",
    lat: 15.95,
    lon: 48.8,
    radiusKm: 4,
    note: "Arid valley date-palm and sorghum zone",
  },
  {
    id: "kabul-valley",
    name: "Kabul Valley",
    country: "Afghanistan",
    emoji: "🇦🇫",
    lat: 34.5,
    lon: 69.2,
    radiusKm: 5,
    note: "Semi-arid highland cereal farming",
  },
  {
    id: "kivu-highlands",
    name: "Kivu Highlands",
    country: "DR Congo",
    emoji: "🇨🇩",
    lat: -1.7,
    lon: 28.9,
    radiusKm: 4,
    note: "Tropical highland mixed-crop smallholders",
  },
  {
    id: "punjab-pakistan",
    name: "Central Punjab",
    country: "Pakistan",
    emoji: "🇵🇰",
    lat: 30.9,
    lon: 73.8,
    radiusKm: 5,
    note: "Irrigated wheat–rice double-crop belt",
  },
  {
    id: "nile-delta",
    name: "Nile Delta",
    country: "Egypt",
    emoji: "🇪🇬",
    lat: 30.85,
    lon: 31.1,
    radiusKm: 4,
    note: "Intensive irrigated horticulture",
  },
  {
    id: "tigray-plateau",
    name: "Tigray Plateau",
    country: "Ethiopia",
    emoji: "🇪🇹",
    lat: 13.9,
    lon: 39.0,
    radiusKm: 4,
    note: "Dryland teff and barley terraced farming",
  },
  {
    id: "mekong-delta",
    name: "Mekong Delta",
    country: "Vietnam",
    emoji: "🇻🇳",
    lat: 10.05,
    lon: 105.75,
    radiusKm: 5,
    note: "Triple-cropped lowland rice system",
  },
  {
    id: "sao-francisco",
    name: "São Francisco Valley",
    country: "Brazil",
    emoji: "🇧🇷",
    lat: -9.4,
    lon: -40.5,
    radiusKm: 5,
    note: "Semi-arid irrigated fruit and wine grapes",
  },
]
