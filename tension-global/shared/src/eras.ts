import type { Era } from './types';

export interface EraInfo {
  era: Era;
  title: string;
  years: string;
  lead: string;
  recap: string[];
  changes: string[];
}

export const ERA_INFO: Record<Era, EraInfo> = {
  1: {
    era: 1,
    title: 'Telón de Acero',
    years: '1947–1962',
    lead: 'Europa queda dividida y las dos superpotencias compiten por alianzas, armas nucleares y satélites.',
    recap: [
      'Se forman la OTAN (1949) y el Pacto de Varsovia (1955).',
      'La Guerra de Corea (1950–53) y la Revolución China (1949) extienden la competencia a Asia.',
      'La crisis de los misiles de Cuba (1962) lleva al mundo al borde de un conflicto nuclear.',
    ],
    changes: ['Entran las cartas de la era 1, las genéricas y la puntuación de Europa, Asia y Medio Oriente.'],
  },
  2: {
    era: 2,
    title: 'Coexistencia y crisis',
    years: '1962–1979',
    lead: 'Tras Cuba se abren canales de diálogo, pero la competencia continúa en el Tercer Mundo.',
    recap: [
      'Los acuerdos SALT limitan parte del armamento estratégico (1972).',
      'Vietnam, Oriente Medio y la crisis del petróleo marcan la década de 1970.',
      'La llegada del ser humano a la Luna (1969) simboliza la carrera tecnológica.',
    ],
    changes: [
      'Salen las cartas de la era 1 del mazo y entran las de la era 2.',
      'Entran las cartas de puntuación de África y las Américas.',
    ],
  },
  3: {
    era: 3,
    title: 'Ocaso de la Guerra Fría',
    years: '1979–1991',
    lead: 'Afganistán y la carrera armamentista reabren la tensión; luego llegan las reformas y los cambios de 1989.',
    recap: [
      'La intervención en Afganistán (1979) y la crisis de 1983 elevan la tensión.',
      'Las reformas de Gorbachov abren una etapa de distensión.',
      'En 1989 cae el Muro de Berlín y cambian los gobiernos de Europa central y oriental.',
    ],
    changes: ['Salen las cartas de la era 2 del mazo y entran las de la era 3.'],
  },
  4: {
    era: 4,
    title: 'Momento unipolar',
    years: '1991–2008',
    lead: 'La URSS se disuelve y EE.UU. queda como principal potencia. Rusia y China pasan a encabezar el Bloque Oriental.',
    recap: [
      'En 1991 se disuelve la Unión Soviética y aparecen quince Estados independientes.',
      'La Guerra del Golfo y las guerras de Yugoslavia marcan los años noventa.',
      'Tras el 11-S (2001) se abre un ciclo de intervenciones en Asia Central y Oriente Medio.',
    ],
    changes: [
      'Se disuelve la URSS: desaparece Alemania Oriental y su influencia occidental pasa a Alemania.',
      'Aparecen Ucrania, Georgia, Kazajistán y Emiratos.',
      'El Bloque Oriental pierde 1 de influencia en Polonia, Chequia, Hungría, Afganistán y Etiopía.',
      'La Tensión vuelve a 5 y se activa el Riesgo de IA.',
    ],
  },
  5: {
    era: 5,
    title: 'Orden multipolar',
    years: '2008–2026',
    lead: 'Crece el peso de China, India y otras potencias medias; la inteligencia artificial se convierte en un factor estratégico.',
    recap: [
      'La crisis financiera de 2008 debilita la confianza en el orden económico previo.',
      'Georgia (2008) anticipa una década de disputas en el espacio postsoviético.',
      'Internet y la expansión de los teléfonos inteligentes cambian la política y la economía.',
    ],
    changes: ['Salen las cartas de la era 4 del mazo y entran las de la era 5, incluidas las de IA recientes.'],
  },
};

export const FINAL_YEAR = 2026;
/** Año aproximado mostrado en la barra superior para cada turno. */
export const TURN_YEAR: number[] = [0, 1947, 1955, 1962, 1971, 1979, 1985, 1991, 2000, 2008, 2017];
