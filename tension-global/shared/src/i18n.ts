// Textos en inglés de los datos del juego (el español es el idioma base de los datos).
import type { CountryId, Era, Region, Side } from './types';

export type Lang = 'es' | 'en';

export const SIDE_NAME_EN: Record<Side, string> = { W: 'the West', E: 'the Eastern Bloc' };
export const SIDE_SHORT: Record<Lang, Record<Side, string>> = {
  es: { W: 'Occidente', E: 'Bloque Oriental' },
  en: { W: 'West', E: 'Eastern Bloc' },
};
export const REGION_NAME_EN: Record<Region, string> = {
  EU: 'Europe',
  AS: 'Asia',
  ME: 'Middle East',
  AF: 'Africa',
  AM: 'Americas',
};

export const COUNTRY_EN: Record<CountryId, [name: string, short: string]> = {
  uk: ['United Kingdom', 'UK'],
  fr: ['France', 'France'],
  de: ['West Germany', 'W. Germany'],
  dde: ['East Germany', 'E. Germany'],
  pl: ['Poland', 'Poland'],
  cz: ['Czechoslovakia', 'Czechoslov.'],
  hu: ['Hungary', 'Hungary'],
  es: ['Spain', 'Spain'],
  it: ['Italy', 'Italy'],
  yu: ['Yugoslavia/Serbia', 'Yugoslavia'],
  ro: ['Romania', 'Romania'],
  gr: ['Greece', 'Greece'],
  tr: ['Turkey', 'Turkey'],
  fi: ['Finland', 'Finland'],
  ua: ['Ukraine', 'Ukraine'],
  ge: ['Georgia', 'Georgia'],
  il: ['Israel', 'Israel'],
  lb: ['Lebanon', 'Lebanon'],
  sy: ['Syria', 'Syria'],
  jo: ['Jordan', 'Jordan'],
  eg: ['Egypt', 'Egypt'],
  ly: ['Libya', 'Libya'],
  iq: ['Iraq', 'Iraq'],
  ir: ['Iran', 'Iran'],
  sa: ['Saudi Arabia', 'Saudi Ar.'],
  ae: ['UAE', 'UAE'],
  af: ['Afghanistan', 'Afghanistan'],
  pk: ['Pakistan', 'Pakistan'],
  in: ['India', 'India'],
  cn: ['China', 'China'],
  kp: ['North Korea', 'N. Korea'],
  kr: ['South Korea', 'S. Korea'],
  jp: ['Japan', 'Japan'],
  tw: ['Taiwan', 'Taiwan'],
  vn: ['Vietnam', 'Vietnam'],
  th: ['Thailand', 'Thailand'],
  ph: ['Philippines', 'Philippines'],
  id: ['Indonesia', 'Indonesia'],
  kz: ['Kazakhstan', 'Kazakhstan'],
  ma: ['Morocco', 'Morocco'],
  dz: ['Algeria', 'Algeria'],
  sahel: ['Sahel', 'Sahel'],
  ng: ['Nigeria', 'Nigeria'],
  sd: ['Sudan', 'Sudan'],
  et: ['Ethiopia', 'Ethiopia'],
  cg: ['Congo', 'Congo'],
  ke: ['Kenya', 'Kenya'],
  ao: ['Angola', 'Angola'],
  mz: ['Mozambique', 'Mozamb.'],
  za: ['South Africa', 'S. Africa'],
  ca: ['Canada', 'Canada'],
  mx: ['Mexico', 'Mexico'],
  cu: ['Cuba', 'Cuba'],
  do: ['Dominican Rep.', 'Dom. Rep.'],
  gt: ['Guatemala', 'Guatemala'],
  ni: ['Nicaragua', 'Nicaragua'],
  pa: ['Panama', 'Panama'],
  co: ['Colombia', 'Colombia'],
  ve: ['Venezuela', 'Venezuela'],
  pe: ['Peru', 'Peru'],
  br: ['Brazil', 'Brazil'],
  bo: ['Bolivia', 'Bolivia'],
  cl: ['Chile', 'Chile'],
  ar: ['Argentina', 'Argentina'],
};

export const TECH_NAMES_EN = ['Satellite', 'Crewed flight', 'Moon landing', 'ARPANET', 'GPS', 'Global internet', 'Smartphone', 'Advanced AI'];

export interface EraText {
  title: string;
  lead: string;
  recap: string[];
  changes: string[];
}

export const ERA_EN: Record<Era, EraText> = {
  1: {
    title: 'Iron Curtain',
    lead: 'Europe is divided and the two superpowers compete for alliances, nuclear weapons and satellites.',
    recap: [
      'NATO (1949) and the Warsaw Pact (1955) are founded.',
      'The Korean War (1950–53) and the Chinese Revolution (1949) extend the rivalry to Asia.',
      'The Cuban Missile Crisis (1962) brings the world to the brink of nuclear war.',
    ],
    changes: ['Era 1 cards, generic cards and the Europe, Asia and Middle East scoring cards enter the deck.'],
  },
  2: {
    title: 'Coexistence and Crisis',
    lead: 'After Cuba, channels of dialogue open, but competition continues across the Third World.',
    recap: [
      'The SALT agreements limit part of the strategic arsenal (1972).',
      'Vietnam, the Middle East and the oil crisis shape the 1970s.',
      'The first Moon landing (1969) symbolizes the technology race.',
    ],
    changes: ['Era 1 cards leave the deck and era 2 cards enter.', 'The Africa and Americas scoring cards enter.'],
  },
  3: {
    title: 'Twilight of the Cold War',
    lead: 'Afghanistan and the arms race reignite tension; then come reforms and the changes of 1989.',
    recap: [
      'The intervention in Afghanistan (1979) and the 1983 crisis raise tension.',
      "Gorbachev's reforms open a period of détente.",
      'In 1989 the Berlin Wall falls and governments change across Central and Eastern Europe.',
    ],
    changes: ['Era 2 cards leave the deck and era 3 cards enter.'],
  },
  4: {
    title: 'Unipolar Moment',
    lead: 'The USSR dissolves and the US is left as the leading power. Russia and China now head the Eastern Bloc.',
    recap: [
      'In 1991 the Soviet Union dissolves and fifteen independent states emerge.',
      'The Gulf War and the Yugoslav wars mark the 1990s.',
      'After 9/11 (2001) a cycle of interventions begins in Central Asia and the Middle East.',
    ],
    changes: [
      'The USSR dissolves: East Germany disappears and its Western influence passes to Germany.',
      'Ukraine, Georgia, Kazakhstan and the UAE appear.',
      'The Eastern Bloc loses 1 influence in Poland, Czechia, Hungary, Afghanistan and Ethiopia.',
      'Tension returns to 5 and AI Risk becomes active.',
    ],
  },
  5: {
    title: 'Multipolar Order',
    lead: 'China, India and other middle powers gain weight; artificial intelligence becomes a strategic factor.',
    recap: [
      'The 2008 financial crisis undermines confidence in the previous economic order.',
      'Georgia (2008) foreshadows a decade of disputes across the post-Soviet space.',
      'The internet and the spread of smartphones transform politics and the economy.',
    ],
    changes: ['Era 4 cards leave the deck and era 5 cards enter, including the recent AI cards.'],
  },
};

export const STATUS_NAME: Record<Lang, Record<'none' | 'presence' | 'domination' | 'control', string>> = {
  es: { none: 'sin presencia', presence: 'Presencia', domination: 'Dominio', control: 'Control' },
  en: { none: 'no presence', presence: 'Presence', domination: 'Domination', control: 'Control' },
};
