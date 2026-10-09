/* «El Espíritu Santo y el patrocinador» — 16:9, 12 min, sin voz (la narración se graba encima).
   Cada dato va atribuido en pantalla. Ninguna imagen real: todas las caras son dibujos rotulados.
   No se usa ningún escudo, logotipo ni marca de club, casa de apuestas o partido. */

// ---------- beat runner ----------
function run(list, tau) { let acc = 0; for (const b of list) { if (tau < acc + b[0]) { b[1](tau - acc, b[0]); return; } acc += b[0]; } const l = list[list.length - 1]; l[1](l[0], l[0]); }
const IN = (t, a = .5) => sm(0, a, t);                      // fade/wipe in
const OUT = (t, d, a = .45) => 1 - sm(d - a, d, t);          // fade out at the end of a beat
const BOTH = (t, d, a = .5) => Math.min(IN(t, a), OUT(t, d, a));
let CH = '';                                                  // current chapter label for the band
function frame(c, t, d, o = {}) { bg(c, o); }

// a standing block: kicker + headline + optional paragraph
function block(c, t, o = {}) {
  const { k = '', h1 = '', h2 = '', body = '', x = 150, y = 300, maxW = 1240, size = 92, al = 1 } = o;
  if (al <= 0) return;
  c.save(); c.globalAlpha = al;
  if (k) kicker(c, k, x, y - 56, { p: sm(0, .45, t) });
  if (h1) head(c, h1, x, y + 70, { size, p: sm(.15, 1.0, t) });
  if (h2) head(c, h2, x, y + 70 + size * 1.08, { size, p: sm(.5, 1.4, t), color: RED });
  if (body) para(c, body, x, y + 70 + size * 1.08 * (h2 ? 2 : 1) + 26, maxW, { size: 40, p: sm(.9, 2.2, t) });
  c.restore();
}

// ============================================================ APERTURA (36 s)
function sOpen(c, tau) {
  const d = 36; bg(c, { dark: .06 });
  run([
    [9, (t) => {
      const a = BOTH(t, 9);
      c.save(); c.globalAlpha = a;
      ball(c, CX, 470, 92, { p: sm(.2, 1.4, t), rot: t * .35 });
      txt(c, '4 DE OCTUBRE DE 2026', CX, 700, { size: 40, family: MONO, weight: 700, track: 8, align: 'middle', p: sm(.7, 1.8, t) });
      head(c, 'Brasil vota', CX, 820, { size: 104, align: 'middle', p: sm(1.2, 2.4, t) });
      c.restore();
    }],
    [10, (t) => {
      const a = BOTH(t, 10);
      c.save(); c.globalAlpha = a;
      portrait(c, 'neymar', 430, 450, 1.9, { p: sm(.1, 1.2, t), name: 'Neymar', tau: t });
      block(c, t - .6, { x: 820, y: 330, maxW: 960, k: 'SALE DE VOTAR', h1: 'Publica un vídeo', h2: 'y hace un gesto', size: 78,
        body: 'En el vídeo aparece el número 22, el del candidato del PL. Unos medios lo cuentan como una declaración de voto; otros, solo como un gesto.' });
      c.restore();
    }],
    [9, (t) => {
      const a = BOTH(t, 9);
      c.save(); c.globalAlpha = a;
      portrait(c, 'alves', 1500, 450, 1.9, { p: sm(.1, 1.2, t), name: 'Daniel Alves', tau: t });
      kicker(c, '5 DE OCTUBRE · VÍDEO EN SUS REDES', 150, 300, { p: sm(.3, .9, t) });
      head(c, '«El Espíritu Santo', 150, 420, { size: 82, p: sm(.5, 1.5, t) });
      head(c, 'sopló tu nombre', 150, 510, { size: 82, p: sm(.9, 1.9, t) });
      head(c, 'dos veces»', 150, 600, { size: 82, color: RED, p: sm(1.3, 2.3, t) });
      cap(c, 'Pide el voto para Flávio Bolsonaro y cita la Biblia.', 150, 690, { size: 36, p: sm(2.0, 3.0, t) });
      c.restore();
    }],
    [8, (t) => {
      const a = BOTH(t, 8, .7); resetT(c);
      c.fillStyle = PAL.night; c.globalAlpha = a; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
      c.save(); c.globalAlpha = a;
      grain(c, rectPath(0, 0, W, H), [0, 0, W, H], 2600, '#ffffff', .035, 61, 1.7);
      txt(c, 'EL ESPÍRITU SANTO', CX, 470, { size: 116, weight: 700, squeeze: .84, align: 'middle', color: PAL.paper, p: sm(.2, 1.4, t) });
      txt(c, 'Y EL PATROCINADOR', CX, 596, { size: 116, weight: 700, squeeze: .84, align: 'middle', color: YELLOW, p: sm(.7, 1.9, t) });
      c.fillStyle = RED; const bw = 300 * sm(1.4, 2.2, t); c.fillRect(CX - bw / 2, 648, bw, 7);
      txt(c, 'Fútbol, dinero y fe en la elección brasileña de 2026', CX, 730, { size: 40, family: MONO, weight: 400, align: 'middle', color: alpha(PAL.paper, .7), p: sm(1.6, 2.8, t) });
      c.restore();
    }],
  ], tau);
}

// ============================================================ 1 · EL GESTO (4 + 96)
function sCard1(c, t) { chapterCard(c, 1, 'El gesto', 'Lo que pasó el domingo', t); }
function sGesto(c, tau) {
  const d = 96; CH = '01 · EL GESTO'; bg(c);
  run([
    [13, (t) => {
      block(c, t, { k: 'PRIMERA VUELTA · 4 DE OCTUBRE', h1: 'Nadie llegó', h2: 'a la mayoría', size: 86, y: 240 });
      bars(c, [{ k: 'Flávio Bolsonaro', v: 47.03, c: BLUE }, { k: 'Lula', v: 45.16, c: RED }, { k: 'Otros', v: 7.81, c: alpha(INK, .35) }],
        { x: 520, y: 640, w: 1180, bh: 70, gap: 30, max: 50, p: sm(1.2, 3.2, t), fmtv: v => v.toFixed(2).replace('.', ',') + '%' });
      cap(c, 'porcentaje de votos válidos', 520, 900, { size: 28, p: sm(2.6, 3.4, t) });
      sourceTag(c, 'TSE · apuración del primer turno');
    }],
    [12, (t) => {
      block(c, t, { k: 'LA DISTANCIA', h1: 'Menos de dos puntos', size: 84, y: 230 });
      bigNum(c, 2.2, 620, 640, { p: sm(.9, 2.6, t), size: 230, decimals: 1, color: RED });
      cap(c, 'millones de votos de diferencia', 620, 710, { size: 38, align: 'middle', p: sm(2.0, 3.0, t) });
      bigNum(c, 21.1, 1400, 640, { p: sm(1.6, 3.2, t), size: 230, decimals: 1, suffix: '%', color: INK });
      cap(c, 'de abstención, la mayor desde 1998', 1400, 710, { size: 38, align: 'middle', p: sm(2.6, 3.6, t) });
      ring(c, 620, 590, 260, 130, sm(3.2, 4.4, t));
      cap(c, 'La menor diferencia desde la redemocratización.', 150, 880, { size: 38, p: sm(3.6, 4.8, t) });
      sourceTag(c, 'TSE · prensa brasileña');
    }],
    [13, (t) => {
      const P = brazil(c, { p: sm(.2, 2.2, t), x: 1080, y: 110, w: 740 });
      block(c, t, { k: 'SEGUNDA VUELTA', h1: '25 de octubre', h2: 'Lula o Flávio', size: 86, y: 300,
        body: 'Entre una vuelta y otra, las dos campañas salen a buscar apoyos. Y en Brasil hay dos púlpitos enormes: el campo de fútbol y la iglesia.' });
      sourceTag(c, 'mapa simplificado, no cartográfico');
    }],
    [13, (t) => {
      block(c, t, { k: 'EL VÍDEO DE NEYMAR', h1: 'Lo que se ve', size: 80, y: 220 });
      card(c, 150, 420, 740, 330, { p: sm(.6, 1.6, t), seed: 12, rot: -.012 });
      para(c, 'Vota, graba, aparece el número 22 y lo acompaña otra persona con el mismo gesto.', 200, 520, 640, { size: 38, p: sm(1.0, 2.4, t) });
      head(c, 'Lo que no', 1010, 300, { size: 80, color: RED, p: sm(1.8, 2.8, t) });
      card(c, 1010, 420, 760, 330, { p: sm(2.0, 3.0, t), seed: 13, rot: .014 });
      para(c, 'Si eso cuenta como declaración formal de voto. Unos medios dicen que la hizo; otros, que solo fue el gesto.', 1060, 520, 660, { size: 38, p: sm(2.4, 3.8, t) });
      cap(c, 'En 2022 sí había declarado su voto a Jair Bolsonaro, de forma explícita.', 150, 860, { size: 38, p: sm(3.6, 4.8, t) });
      sourceTag(c, 'Bnews / ND Mais · 4-5 de octubre de 2026');
    }],
    [12, (t) => {
      block(c, t, { k: 'LO QUE ESTÁ EN JUEGO', h1: 'Un apoyo del fútbol', h2: 'vale campaña', size: 80, y: 250 });
      shirt(c, 1420, 520, 3.0, { body: '#f0ece2', p: sm(.6, 1.6, t), num: '10' });
      para(c, 'Tanto, que el Corinthians tuvo que desmentir un comunicado falso, hecho con inteligencia artificial, en el que el club apoyaba a Flávio Bolsonaro. El club no apoyó a nadie.', 150, 640, 1120, { size: 42, p: sm(1.4, 3.4, t) });
      ring(c, 1420, 500, 210, 230, sm(3.0, 4.2, t));
      sourceTag(c, 'Comunicado del Corinthians');
    }],
    [16, (t) => {
      block(c, t, { k: 'TRES HILOS', h1: 'Esta historia', h2: 'tiene tres cabos', size: 84, y: 190 });
      const items = [['EL PATROCINIO', 'El gobierno prohibió las apuestas. Catorce de veinte clubes las llevaban en la camiseta.', GREEN],
                     ['LOS JUGADORES', 'Unos piden el voto para un lado, otros para el otro. Los más ruidosos, para el mismo.', BLUE],
                     ['LA FE', 'Uno de cada cuatro brasileños es evangélico. Y en la selección, la mayoría.', RED]];
      items.forEach(([a, b, col], i) => {
        const q = sm(1.0 + i * .7, 2.4 + i * .7, t), x = 150 + i * 560;
        card(c, x, 540, 520, 330, { p: q, seed: 20 + i, rot: (i - 1) * .014 });
        c.save(); c.fillStyle = col; c.globalAlpha = clamp(q * 2, 0, 1); c.fillRect(x + 36, 580, 74, 7); c.restore();
        txt(c, a, x + 36, 648, { size: 32, family: MONO, weight: 700, track: 2, color: col, p: clamp(q * 1.5, 0, 1) });
        para(c, b, x + 36, 706, 440, { size: 34, p: clamp((q - .3) * 1.6, 0, 1) });
      });
      sourceTag(c, '');
    }],
    [17, (t) => {
      block(c, t, { k: 'EMPECEMOS POR EL DINERO', h1: 'El 25 de septiembre', h2: 'cambió el fútbol brasileño', size: 82, y: 300,
        body: 'No por un fichaje ni por un escándalo arbitral: por un decreto firmado en Brasilia.' });
      portrait(c, 'lula', 1540, 450, 1.75, { p: sm(1.4, 2.6, t), name: 'Lula da Silva', tau: t });
      sourceTag(c, '');
    }],
  ], tau);
  band(c, CH, tau / d);
}

// ============================================================ 2 · LA MEDIDA (4 + 126)
function sCard2(c, t) { chapterCard(c, 2, 'La medida', 'Una firma contra las apuestas', t); }
function sMedida(c, tau) {
  const d = 126; CH = '02 · LA MEDIDA'; bg(c);
  run([
    [14, (t) => {
      block(c, t, { k: '25 DE SEPTIEMBRE DE 2026', h1: 'Lula firma', h2: 'la MP 1.394/2026', size: 88, y: 260,
        body: 'Una medida provisional: tiene fuerza de ley desde el primer día, pero caduca si el Congreso no la aprueba.' });
      card(c, 1240, 300, 520, 620, { p: sm(.8, 1.8, t), seed: 31, rot: .016 });
      squiggleText(c, 1290, 400, 420, 9, { seed: 4, lineH: 26, color: alpha(INK, .35) });
      c.save(); c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round';
      selfDraw(c, [[1300, 760], [1360, 700], [1420, 770], [1490, 690], [1560, 760], [1640, 700]], sm(1.8, 3.0, t), 9, 2, false); c.restore();
      c.save(); c.setLineDash([9, 9]); c.strokeStyle = alpha(INK, .4); c.lineWidth = 2;
      c.beginPath(); c.moveTo(1290, 800); c.lineTo(1710, 800); c.stroke(); c.restore();
      sourceTag(c, 'MP 1.394/2026');
    }],
    [15, (t) => {
      block(c, t, { k: 'QUÉ PROHÍBE', h1: 'Las apuestas de cuota fija', size: 78, y: 210 });
      const rows = ['explotar', 'ofrecer', 'intermediar', 'y publicitar'];
      rows.forEach((r, i) => { const q = sm(1.0 + i * .55, 2.0 + i * .55, t);
        c.save(); c.globalAlpha = clamp(q, 0, 1); c.fillStyle = RED; c.fillRect(170, 430 + i * 104, 54 * easeOut(q), 54); c.restore();
        txt(c, r, 256, 476 + i * 104, { size: 62, weight: 700, p: q }); });
      para(c, 'En todo el territorio nacional. La publicidad cae con el resto: eso es lo que alcanza a las camisetas.', 820, 500, 900, { size: 42, p: sm(2.8, 4.4, t) });
      ring(c, 1270, 690, 420, 90, sm(4.2, 5.4, t));
      txt(c, 'y publicitar', 1270, 706, { size: 62, weight: 700, align: 'middle', color: RED, p: sm(4.0, 4.8, t) });
      sourceTag(c, 'MP 1.394/2026');
    }],
    [14, (t) => {
      block(c, t, { k: 'EL CALENDARIO', h1: 'Cinco días', h2: 'para retirar el saldo', size: 82, y: 220 });
      const marks = [['5 OCT · 23:59', 'último momento para sacar el dinero', 460], ['6 OCT', 'las plataformas quedan fuera del aire', 1200]];
      c.save(); c.strokeStyle = alpha(INK, .3); c.lineWidth = 4; c.beginPath(); c.moveTo(300, 700); c.lineTo(1700, 700); c.stroke(); c.restore();
      marks.forEach(([a, b, x], i) => { const q = sm(1.2 + i * .9, 2.4 + i * .9, t);
        c.save(); c.fillStyle = i ? RED : INK; c.globalAlpha = clamp(q, 0, 1); c.beginPath(); c.arc(x, 700, 16 * easeOutBack(clamp(q, 0, 1)), 0, TAU); c.fill(); c.restore();
        txt(c, a, x, 660, { size: 42, weight: 700, align: 'middle', color: i ? RED : INK, p: q });
        para(c, b, x - 230, 770, 460, { size: 34, p: clamp(q - .3, 0, 1), align: 'middle' }); });
      cap(c, 'Y ocurrió: la noche del 5 al 6 las webs dejaron de funcionar, sin que ningún tribunal lo frenase.', 150, 900, { size: 38, p: sm(3.6, 5.0, t) });
      sourceTag(c, 'Agência Brasil · Metrópoles');
    }],
    [20, (t) => {
      block(c, t, { k: 'LA SÉRIE A', h1: '14 de 20 clubes', h2: 'llevaban una casa de apuestas', size: 72, y: 170 });
      for (let i = 0; i < 20; i++) {
        const col = i % 7, row = Math.floor(i / 7), x = 330 + col * 190, y = 540 + row * 180;
        const q = sm(1.0 + i * .13, 1.8 + i * .13, t), isBet = i < 14;
        shirt(c, x, y, 1.5, { body: isBet ? '#f0ece2' : '#ded8c8', p: q, sponsor: isBet, trim: isBet ? INK : alpha(INK, .45) });
        if (isBet && sm(3.6, 4.6, t) > 0) { c.save(); c.globalAlpha = sm(3.6, 4.6, t); c.fillStyle = RED; c.fillRect(x - 28, y + 2, 56, 16); c.restore(); }
      }
      cap(c, 'Sin patrocinador principal de apuestas: Bahia, Mirassol, Athletico-PR, Bragantino, Internacional y Coritiba.', 330, 930, { size: 34, p: sm(4.6, 6.0, t) });
      sourceTag(c, 'Metrópoles · recuento de la Série A 2026');
    }],
    [17, (t) => {
      block(c, t, { k: 'CUÁNTO DINERO', h1: 'R$ 1.140 millones', size: 92, y: 200 });
      bigNum(c, 7.9, 560, 640, { p: sm(1.0, 2.8, t), size: 260, decimals: 1, suffix: '%', color: GREEN });
      para(c, 'de los ingresos de los clubes de la Série A venían de las casas de apuestas en 2025.', 300, 740, 560, { size: 38, p: sm(2.4, 3.8, t) });
      card(c, 1120, 420, 660, 400, { p: sm(2.6, 3.6, t), seed: 44, rot: -.014 });
      kicker(c, 'FLAMENGO', 1170, 500, { p: sm(3.0, 3.8, t) });
      head(c, 'R$ 400-430 M', 1170, 600, { size: 66, color: RED, p: sm(3.2, 4.4, t) });
      para(c, 'es lo que calcula que dejará de ingresar el año que viene.', 1170, 660, 560, { size: 36, p: sm(3.8, 5.0, t) });
      sourceTag(c, 'Cifras publicadas por la prensa deportiva brasileña');
    }],
    [15, (t) => {
      block(c, t, { k: 'EL DETALLE QUE LO RESUME', h1: 'El día 23', h2: 'el Grêmio firmó con una', size: 76, y: 240 });
      para(c, 'Dos días antes de que Lula firmara la medida, y con la polémica ya en marcha, el club cerró un patrocinio con una casa de apuestas. No publicó las cifras.', 150, 560, 1060, { size: 42, p: sm(1.2, 3.0, t) });
      shirt(c, 1500, 520, 3.4, { body: '#f0ece2', p: sm(1.6, 2.6, t), sponsor: true });
      arrow(c, [1280, 760], [1430, 610], sm(3.0, 4.2, t));
      sourceTag(c, 'Metrópoles');
    }],
    [16, (t) => {
      block(c, t, { k: 'POR QUÉ IMPORTA', h1: 'Ese dinero', h2: 'era el de los fichajes', size: 84, y: 250,
        body: 'El patrocinio principal de la camiseta es, en muchos clubes brasileños, la partida que sostiene salarios y traspasos. Si cae de golpe, no se sustituye en una ventana.' });
      const bal = [{ k: 'Con apuestas', v: 100, c: GREEN }, { k: 'Sin apuestas', v: 92.1, c: alpha(INK, .45) }];
      bars(c, bal, { x: 520, y: 700, w: 1100, bh: 62, gap: 28, max: 105, p: sm(2.0, 3.6, t), fmtv: v => Math.round(v) + ' %' });
      cap(c, 'ingreso total de los clubes de la Série A, antes y después, en proporción', 520, 870, { size: 30, p: sm(3.4, 4.4, t) });
      sourceTag(c, 'cálculo sobre el 7,9 % declarado');
    }],
    [15, (t) => {
      block(c, t, { k: 'Y ENTONCES', h1: 'Los clubes', h2: 'fueron a los tribunales', size: 88, y: 320,
        body: 'No contra el gobierno en abstracto: contra una medida concreta, con un argumento concreto.' });
      sourceTag(c, '');
    }],
  ], tau);
  band(c, CH, tau / d);
}

// ============================================================ 3 · LA CONTRAOFENSIVA (4 + 96)
function sCard3(c, t) { chapterCard(c, 3, 'La contraofensiva', 'Dieciséis clubes en el Supremo', t); }
function sPleito(c, tau) {
  const d = 96; CH = '03 · LA CONTRAOFENSIVA'; bg(c);
  run([
    [14, (t) => {
      block(c, t, { k: 'LA ACCIÓN PRINCIPAL', h1: 'ADI 8.027', size: 110, y: 250,
        body: 'La presenta la asociación del sector del juego. Pide que el Supremo suspenda la norma. El ponente es el ministro Luiz Fux.' });
      card(c, 1240, 280, 560, 560, { p: sm(.8, 1.8, t), seed: 51, rot: .013 });
      squiggleText(c, 1290, 380, 460, 12, { seed: 7, lineH: 28, color: alpha(INK, .32) });
      txt(c, 'ADI 8.027', 1520, 340, { size: 44, family: MONO, weight: 700, align: 'middle', color: RED, p: sm(1.4, 2.4, t) });
      sourceTag(c, 'STF · ADI 8.027');
    }],
    [16, (t) => {
      block(c, t, { k: '1 DE OCTUBRE', h1: 'Primero, cinco clubes', size: 82, y: 200 });
      ['São Paulo', 'Ponte Preta', 'Vitória', 'Guarani', 'Portuguesa'].forEach((n, i) => {
        const q = sm(1.0 + i * .5, 2.0 + i * .5, t), x = 220 + i * 330;
        shirt(c, x, 520, 1.6, { body: '#f0ece2', p: q });
        txt(c, n, x, 640, { size: 32, weight: 700, align: 'middle', p: clamp(q - .2, 0, 1) });
      });
      head(c, 'Después, dieciséis', 150, 800, { size: 78, color: RED, p: sm(3.6, 4.8, t) });
      cap(c, 'Flamengo y Botafogo no firmaron el escrito conjunto: fueron por su cuenta.', 150, 880, { size: 38, p: sm(4.4, 5.6, t) });
      sourceTag(c, 'Peticiones presentadas ante el STF');
    }],
    [16, (t) => {
      block(c, t, { k: 'EL ARGUMENTO', h1: '«Ni relevancia', h2: 'ni urgencia»', size: 92, y: 230 });
      para(c, 'Una medida provisional solo cabe, según la Constitución brasileña, cuando el asunto es relevante y urgente. Los clubes dicen que prohibir de golpe un mercado que el propio Estado reguló en 2024 no cumple ninguna de las dos cosas.', 150, 620, 1180, { size: 42, p: sm(1.2, 3.4, t) });
      card(c, 1420, 400, 360, 300, { p: sm(2.4, 3.4, t), seed: 55, rot: -.02, fill: YELLOW });
      txt(c, '1 año', 1600, 540, { size: 86, weight: 700, align: 'middle', p: sm(2.8, 3.8, t) });
      para(c, 'de transición, piden, si no se suspende', 1450, 600, 300, { size: 30, align: 'middle', p: sm(3.2, 4.2, t) });
      sourceTag(c, 'Escritos de los clubes · Congresso em Foco');
    }],
    [16, (t) => {
      block(c, t, { k: 'Y EL TRIBUNAL', h1: 'Todavía no ha decidido', size: 82, y: 210 });
      para(c, 'Al 7 de octubre no había cautelar. Y hay un detalle que los clubes conocen bien: una suspensión posterior no devuelve automáticamente los contratos que ya se rompieron.', 150, 480, 1180, { size: 44, p: sm(1.0, 3.2, t) });
      c.save(); c.strokeStyle = alpha(INK, .25); c.lineWidth = 3; c.setLineDash([12, 10]);
      c.beginPath(); c.arc(1540, 560, 170, 0, TAU); c.stroke(); c.restore();
      txt(c, '?', 1540, 640, { size: 230, weight: 700, align: 'middle', color: alpha(INK, .5), p: sm(1.6, 2.6, t) });
      sourceTag(c, 'Seguimiento procesal · prensa jurídica');
    }],
    [17, (t) => {
      block(c, t, { k: 'LA OTRA PUERTA', h1: 'El Congreso', h2: 'tiene la última palabra', size: 80, y: 190 });
      c.save(); c.strokeStyle = alpha(INK, .3); c.lineWidth = 4; c.beginPath(); c.moveTo(260, 660); c.lineTo(1680, 660); c.stroke(); c.restore();
      [['25 SEP', 'se firma', 300], ['13 OCT', 'fin del plazo de enmiendas', 760], ['~23 NOV', 'límite para votarla', 1400]].forEach(([a, b, x], i) => {
        const q = sm(1.0 + i * .8, 2.2 + i * .8, t);
        c.save(); c.fillStyle = i === 2 ? RED : INK; c.globalAlpha = clamp(q, 0, 1); c.beginPath(); c.arc(x, 660, 15 * easeOutBack(clamp(q, 0, 1)), 0, TAU); c.fill(); c.restore();
        txt(c, a, x, 620, { size: 38, family: MONO, weight: 700, align: 'middle', color: i === 2 ? RED : INK, p: q });
        para(c, b, x - 200, 730, 400, { size: 32, align: 'middle', p: clamp(q - .3, 0, 1) }); });
      cap(c, 'Si no la votan a tiempo, la prohibición decae por sí sola.', 260, 860, { size: 40, p: sm(3.8, 5.0, t) });
      sourceTag(c, 'Agência Senado');
    }],
    [17, (t) => {
      block(c, t, { k: 'LA CONSULTA DEL SENADO', h1: 'Y la gente', h2: 'opinó lo contrario', size: 82, y: 200 });
      bigNum(c, 218000, 560, 580, { p: sm(1.0, 2.6, t), size: 150, color: INK });
      cap(c, 'manifestaciones recogidas', 560, 650, { size: 36, align: 'middle', p: sm(2.0, 3.0, t) });
      bigNum(c, 69.1, 1420, 580, { p: sm(1.8, 3.4, t), size: 190, decimals: 1, suffix: '%', color: GREEN });
      cap(c, 'a favor de prohibir las apuestas', 1420, 650, { size: 36, align: 'middle', p: sm(2.8, 3.8, t) });
      ring(c, 1420, 530, 300, 140, sm(3.6, 4.8, t), { color: GREEN });
      cap(c, 'Una consulta pública no obliga a ningún senador a votar en ese sentido.', 150, 850, { size: 38, p: sm(4.2, 5.4, t) });
      sourceTag(c, 'Consulta pública del Senado');
    }],
  ], tau);
  band(c, CH, tau / d);
}

// ============================================================ 4 · LOS JUGADORES (4 + 106)
function sCard4(c, t) { chapterCard(c, 4, 'Los jugadores', 'Quién pide el voto, y para quién', t); }
function sJugadores(c, tau) {
  const d = 106; CH = '04 · LOS JUGADORES'; bg(c);
  run([
    [15, (t) => {
      portrait(c, 'alves', 440, 430, 2.0, { p: sm(.2, 1.4, t), name: 'Daniel Alves', tau: t });
      block(c, t - .4, { x: 880, y: 250, maxW: 920, k: '5 DE OCTUBRE', h1: 'Pide el voto', h2: 'y lo llama obediencia', size: 72,
        body: 'En un vídeo con citas bíblicas dice que el Espíritu Santo le sopló el nombre y el número del candidato, y le pide que siga siendo humilde.' });
      sourceTag(c, 'Vídeo publicado por el jugador · prensa brasileña');
    }],
    [13, (t) => {
      block(c, t, { k: 'NO ES SU PRIMERA VEZ', h1: 'En 2022 ya declaró', h2: 'su voto a Jair Bolsonaro', size: 76, y: 260,
        body: 'La cobertura de este apoyo recuerda además su caso judicial en España: fue condenado por agresión sexual y, en marzo de 2025, el tribunal superior catalán anuló la condena y lo absolvió por falta de prueba suficiente.' });
      sourceTag(c, 'TSJ de Cataluña, marzo de 2025');
    }],
    [15, (t) => {
      block(c, t, { k: 'NO ESTÁ SOLO', h1: 'Del lado de Flávio', size: 84, y: 190 });
      [['Neymar', 'el gesto del 22, el día de la votación'], ['Romário', 'apoyo público antes de la primera vuelta'], ['Dedé', 'apoyo público antes de la primera vuelta']].forEach(([n, b], i) => {
        const q = sm(1.0 + i * .7, 2.2 + i * .7, t), x = 180 + i * 560;
        card(c, x, 420, 520, 360, { p: q, seed: 61 + i, rot: (i - 1) * .015 });
        txt(c, n, x + 40, 510, { size: 56, weight: 700, p: clamp(q * 1.4, 0, 1) });
        c.save(); c.fillStyle = BLUE; c.globalAlpha = clamp(q * 2, 0, 1); c.fillRect(x + 40, 540, 70 * easeOut(clamp(q, 0, 1)), 6); c.restore();
        para(c, b, x + 40, 610, 440, { size: 34, p: clamp(q - .25, 0, 1) }); });
      sourceTag(c, 'ND Mais · A Tarde · prensa deportiva');
    }],
    [14, (t) => {
      block(c, t, { k: 'Y DEL OTRO', h1: 'Paulinho, del Palmeiras', size: 80, y: 250,
        body: 'Es, según la prensa brasileña, uno de los jugadores en activo más visibles a favor de Lula. El fútbol brasileño no vota en bloque: lo que ocurre es que las voces más ruidosas apuntan casi todas al mismo lado.' });
      shirt(c, 1480, 520, 3.2, { body: GREEN, trim: PAL.light, p: sm(1.0, 2.0, t) });
      sourceTag(c, 'A Tarde');
    }],
    [15, (t) => {
      block(c, t, { k: 'EL AVISO', h1: 'Y un comunicado falso', size: 80, y: 210 });
      card(c, 420, 400, 1080, 400, { p: sm(.8, 1.8, t), seed: 70, rot: -.008 });
      squiggleText(c, 480, 480, 960, 7, { seed: 11, lineH: 32, color: alpha(INK, .3) });
      c.save(); c.strokeStyle = RED; c.lineWidth = 11; c.lineCap = 'round';
      selfDraw(c, [[500, 440], [1420, 760]], sm(2.2, 3.0, t), 12, 3, false);
      selfDraw(c, [[1420, 440], [500, 760]], sm(2.6, 3.4, t), 13, 3, false); c.restore();
      para(c, 'Circuló una nota, generada con IA, en la que el Corinthians apoyaba a Flávio Bolsonaro. El club lo desmintió: no apoyó a ningún candidato.', 420, 880, 1080, { size: 40, p: sm(3.2, 4.6, t) });
      sourceTag(c, 'Comunicado del Corinthians');
    }],
    [16, (t) => {
      block(c, t, { k: 'LO QUE NO SE PUEDE DECIR', h1: 'Que el fútbol', h2: 'es bolsonarista', size: 88, y: 230,
        body: 'No hay dato que lo sostenga: hay declaraciones individuales, de un lado y del otro, y muchísimos jugadores que no dicen nada. Lo que sí se puede observar es el idioma en el que hablan los que hablan.' });
      sourceTag(c, '');
    }],
    [18, (t) => {
      block(c, t, { k: 'FÍJATE EN LAS PALABRAS', h1: 'No dicen política:', h2: 'dicen obediencia', size: 82, y: 200 });
      card(c, 260, 460, 1400, 300, { p: sm(1.0, 2.0, t), seed: 75, rot: .006, fill: PAL.light });
      txt(c, '«Es la política de la obediencia: obedecer lo que el Señor pone en el corazón»', CX, 600, { size: 46, family: SERIF_F, weight: 400, align: 'middle', p: sm(1.4, 3.2, t) });
      cap(c, 'Daniel Alves, en el vídeo del 5 de octubre', CX, 670, { size: 32, align: 'middle', p: sm(3.0, 4.0, t) });
      underline(c, 980, 1420, 614, sm(3.6, 4.6, t));
      head(c, 'Para entender eso hay que salir del campo.', 150, 900, { size: 54, p: sm(4.4, 5.8, t) });
      sourceTag(c, '');
    }],
  ], tau);
  band(c, CH, tau / d);
}

// ============================================================ 5 · LA FE (4 + 126)
function sCard5(c, t) { chapterCard(c, 5, 'La fe', 'El país que cambió de iglesia', t); }
function sFe(c, tau) {
  const d = 126; CH = '05 · LA FE'; bg(c);
  run([
    [15, (t) => {
      block(c, t, { k: 'CENSO DE 2022 · PUBLICADO EN JUNIO DE 2025', h1: 'Brasil dejó de ser', h2: 'lo que era', size: 86, y: 300,
        body: 'El instituto de estadística preguntó por la religión a toda la población de diez años o más. El resultado es la foto de un país que se mueve.' });
      sourceTag(c, 'IBGE · Censo 2022');
    }],
    [20, (t) => {
      kicker(c, 'POBLACIÓN DE 10 AÑOS O MÁS · EN PORCENTAJE', 420, 170, { p: sm(0, .6, t) });
      lines2(c, [{ k: 'católicos', v: [73.6, 65.1, 56.7], c: BLUE }, { k: 'evangélicos', v: [15.4, 21.6, 26.9], c: RED }],
        { x: 420, y: 230, w: 1080, h: 520, p: sm(.8, 4.0, t), ymax: 80 });
      cap(c, 'Dos censos, veintidós años: ocho puntos menos de católicos, cinco más de evangélicos.', 420, 900, { size: 38, p: sm(4.2, 5.6, t) });
      sourceTag(c, 'IBGE · Censos 2000, 2010 y 2022');
    }],
    [14, (t) => {
      block(c, t, { k: 'EN PERSONAS', h1: 'Uno de cada cuatro', size: 86, y: 200 });
      bigNum(c, 47.4, 620, 600, { p: sm(1.0, 2.8, t), size: 240, decimals: 1, color: RED });
      cap(c, 'millones de evangélicos', 620, 670, { size: 40, align: 'middle', p: sm(2.2, 3.2, t) });
      bigNum(c, 100.2, 1420, 600, { p: sm(1.8, 3.6, t), size: 240, decimals: 1, color: BLUE });
      cap(c, 'millones de católicos', 1420, 670, { size: 40, align: 'middle', p: sm(3.0, 4.0, t) });
      cap(c, 'Los católicos siguen siendo mayoría. Pero bajan, y los otros suben.', 150, 850, { size: 40, p: sm(4.0, 5.2, t) });
      sourceTag(c, 'IBGE · Censo 2022');
    }],
    [17, (t) => {
      const P = brazil(c, { p: sm(.2, 2.0, t), x: 1020, y: 100, w: 800 });
      block(c, t, { k: 'Y NO ES IGUAL EN TODAS PARTES', h1: 'El norte', h2: 'es el más evangélico', size: 70, y: 280 });
      dot(c, P, [-60.0, -3.1], { p: sm(2.0, 3.0, t), label: 'Norte · 36,8 %', side: -1, color: RED });
      dot(c, P, [-54.6, -15.6], { p: sm(2.6, 3.6, t), label: 'Centro-Oeste · 31,4 %', side: -1, color: RED });
      dot(c, P, [-42.8, -7.1], { p: sm(3.2, 4.2, t), label: 'Piauí · 15,6 %', side: 1, color: BLUE });
      cap(c, 'Piauí es, a la vez, el estado más católico del país.', 150, 860, { size: 36, p: sm(4.2, 5.4, t) });
      sourceTag(c, 'IBGE · Censo 2022 · mapa simplificado');
    }],
    [14, (t) => {
      block(c, t, { k: 'AHORA VUELVE AL CAMPO', h1: 'La selección', h2: 'reza igual que el país', size: 80, y: 220,
        body: 'Un recuento de la revista Veja sobre los convocados por Carlo Ancelotti encontró una mayoría amplia de evangélicos. El diario británico The Times habla de al menos veinte de los veintiséis.' });
      for (let i = 0; i < 26; i++) { const q = sm(1.4 + i * .08, 2.0 + i * .08, t);
        shirt(c, 390 + (i % 13) * 110, 760 + Math.floor(i / 13) * 130, 1.0, { body: i < 20 ? '#f0ece2' : '#ded8c8', p: q, trim: i < 20 ? RED : alpha(INK, .4) }); }
      sourceTag(c, 'Veja (columna GENTE) · The Times');
    }],
    [14, (t) => {
      block(c, t, { k: 'CUIDADO CON ESTO', h1: 'The Times ató', h2: 'la fe al declive', size: 84, y: 230,
        body: 'El periódico publicó una tesis que liga el avance evangélico a la caída del nivel del fútbol brasileño. Es una opinión periodística, no un dato, y fue criticada por simplificar. La incluimos porque se publicó, no porque esté demostrada.' });
      card(c, 1420, 420, 360, 320, { p: sm(1.6, 2.6, t), seed: 81, rot: .02, fill: YELLOW });
      txt(c, 'OPINIÓN', 1600, 590, { size: 50, family: MONO, weight: 700, align: 'middle', track: 3, p: sm(2.0, 3.0, t) });
      sourceTag(c, 'The Times · recogido por la prensa brasileña');
    }],
    [15, (t) => {
      portrait(c, 'neymar', 440, 430, 2.0, { p: sm(.2, 1.4, t), name: 'Neymar', tau: t, headband: sm(2.0, 2.6, t) > .5 });
      block(c, t - .4, { x: 880, y: 230, maxW: 920, k: 'NO ES NUEVO', h1: 'La cinta de 2015', size: 74,
        body: 'La llevó en la final de la Liga de Campeones con el Barcelona: «100 % Jesus». Destina además parte de su sueldo, como diezmo, a la iglesia bautista en la que creció, en São Paulo.' });
      ring(c, 440, 318, 190, 70, sm(3.0, 4.2, t));
      sourceTag(c, 'Prensa brasileña');
    }],
    [17, (t) => {
      block(c, t, { k: 'POR ESO LAS CAMPAÑAS MIRAN AHÍ', h1: 'Los dos lados', h2: 'pelean el voto evangélico', size: 76, y: 190 });
      const sides = [['LULA', 'Un frente evangélico de apoyo dice que elegir a Flávio sería «un retroceso». La campaña apunta sobre todo a las mujeres evangélicas.', RED],
                     ['FLÁVIO', 'Los sondeos de la consultora Quaest registraron una recuperación suya entre los evangélicos antes de la primera vuelta.', BLUE]];
      sides.forEach(([a, b, col], i) => { const q = sm(1.0 + i * .8, 2.4 + i * .8, t), x = 180 + i * 840;
        card(c, x, 420, 760, 380, { p: q, seed: 90 + i, rot: (i ? 1 : -1) * .012 });
        txt(c, a, x + 44, 510, { size: 54, weight: 700, color: col, p: clamp(q * 1.4, 0, 1) });
        para(c, b, x + 44, 580, 670, { size: 36, p: clamp(q - .25, 0, 1) }); });
      cap(c, 'No ponemos un porcentaje por candidato: no encontramos publicado el cruce por religión de esta elección.', 180, 880, { size: 36, p: sm(3.4, 4.8, t) });
      sourceTag(c, 'Gazeta do Povo · Metrópoles');
    }],
  ], tau);
  band(c, CH, tau / d);
}

// ============================================================ 6 · EL 25 DE OCTUBRE (4 + 76)
function sCard6(c, t) { chapterCard(c, 6, 'El 25 de octubre', 'Lo que decide la urna y lo que no', t); }
function sFinal(c, tau) {
  const d = 76; CH = '06 · EL 25 DE OCTUBRE'; bg(c);
  run([
    [16, (t) => {
      block(c, t, { k: 'LO QUE NO DECIDE LA URNA', h1: 'La prohibición', h2: 'no está en la papeleta', size: 86, y: 240,
        body: 'La medida de las apuestas la resuelven el Supremo y el Congreso, con sus propios plazos. Gane quien gane el domingo 25, esa partida se juega en otro sitio.' });
      sourceTag(c, '');
    }],
    [15, (t) => {
      block(c, t, { k: 'LO QUE SÍ', h1: 'Dos puntos', size: 100, y: 230 });
      bars(c, [{ k: 'Flávio Bolsonaro', v: 47.03, c: BLUE }, { k: 'Lula', v: 45.16, c: RED }],
        { x: 540, y: 560, w: 1120, bh: 78, gap: 34, max: 50, p: sm(.8, 2.6, t), fmtv: v => v.toFixed(2).replace('.', ',') + '%' });
      cap(c, 'Con una abstención del 21,1 %, la mayor desde 1998: el bloque más grande de todos es el que no fue a votar.', 540, 820, { size: 38, p: sm(2.6, 4.2, t) });
      sourceTag(c, 'TSE');
    }],
    [19, (t) => {
      block(c, t, { k: 'TRES COSAS DISTINTAS', h1: 'Un patrocinio,', h2: 'una cinta y un voto', size: 84, y: 180 });
      const items = [['UN PATROCINIO', 'es un contrato', GREEN], ['UNA CINTA', 'es una creencia', YELLOW], ['UN VOTO', 'es una decisión', RED]];
      items.forEach(([a, b, col], i) => { const q = sm(1.2 + i * .8, 2.6 + i * .8, t), x = 180 + i * 560;
        card(c, x, 470, 520, 300, { p: q, seed: 95 + i, rot: (i - 1) * .016 });
        c.save(); c.fillStyle = col; c.globalAlpha = clamp(q * 2, 0, 1); c.fillRect(x + 40, 520, 80, 8); c.restore();
        txt(c, a, x + 40, 600, { size: 40, family: MONO, weight: 700, track: 2, p: clamp(q * 1.4, 0, 1) });
        txt(c, b, x + 40, 670, { size: 44, weight: 700, color: col, p: clamp(q - .2, 0, 1) }); });
      head(c, 'Esta elección las ha metido en el mismo plano.', 180, 880, { size: 58, p: sm(3.8, 5.4, t) });
      sourceTag(c, '');
    }],
    [26, (t) => {
      const a = IN(t, 1);
      c.save(); c.globalAlpha = a;
      portrait(c, 'lula', 380, 360, 1.5, { p: sm(.4, 1.6, t), name: 'Lula da Silva', tau: t });
      portrait(c, 'flavio', 1540, 360, 1.5, { p: sm(.8, 2.0, t), name: 'Flávio Bolsonaro', tau: t });
      ball(c, CX, 390, 86, { p: sm(1.6, 2.8, t), rot: t * .2 });
      txt(c, '25 · 10 · 2026', CX, 884, { size: 80, family: MONO, weight: 700, track: 10, align: 'middle', p: sm(2.4, 3.8, t) });
      c.fillStyle = RED; const bw = 420 * sm(3.4, 4.4, t); c.fillRect(CX - bw / 2, 918, bw, 6);
      cap(c, 'La diferencia cabe en un estadio grande. Varias veces.', CX, 978, { size: 42, align: 'middle', p: sm(4.0, 5.6, t) });
      c.restore();
    }],
  ], tau);
  band(c, CH, tau / d);
}

// ============================================================ FUENTES (34 s)
function sFuentes(c, tau) {
  const d = 34; resetT(c);
  c.fillStyle = PAL.night; c.fillRect(0, 0, W, H);
  grain(c, rectPath(0, 0, W, H), [0, 0, W, H], 2600, '#ffffff', .03, 77, 1.7);
  txt(c, 'FUENTES', 150, 150, { size: 64, weight: 700, squeeze: .86, color: PAL.paper, track: 6, p: sm(.2, 1.2, tau) });
  c.fillStyle = RED; c.fillRect(150, 182, 300 * sm(.8, 1.8, tau), 5);
  const items = [
    ['Resultado de la primera vuelta', 'TSE · 4 de octubre de 2026: Flávio Bolsonaro 47,03 % y Lula 45,16 % de los válidos'],
    ['La medida', 'MP 1.394/2026, firmada el 25 de septiembre; plataformas fuera de línea la noche del 5 al 6 de octubre'],
    ['Los clubes patrocinados', '14 de los 20 de la Série A con una casa de apuestas como patrocinador principal'],
    ['El dinero', 'R$ 1.140 millones en 2025, el 7,9 % de los ingresos; Flamengo calcula perder entre 400 y 430 millones'],
    ['El pleito', 'ADI 8.027 ante el STF, ponente Fux; 16 clubes en un escrito conjunto; Flamengo y Botafogo aparte'],
    ['El Congreso', 'Plazo de enmiendas hasta el 13 de octubre; la MP debe votarse dentro del plazo constitucional'],
    ['La consulta del Senado', 'Más de 218.000 manifestaciones, 69,1 % a favor de la prohibición; no es vinculante'],
    ['Los apoyos', 'Daniel Alves (5 de octubre), Romário y Dedé por Flávio; Paulinho por Lula; el Corinthians desmintió una nota falsa hecha con IA'],
    ['La religión', 'IBGE, Censo 2022 (publicado en junio de 2025): católicos 56,7 %, evangélicos 26,9 %, sin religión 9,3 %'],
    ['La selección', 'Recuento de la columna GENTE de Veja; The Times habla de al menos 20 de 26. Su tesis sobre el declive es una opinión'],
  ];
  items.forEach(([a, b], i) => {
    const q = sm(.9 + i * .22, 1.6 + i * .22, tau), y = 268 + i * 76;
    c.save(); c.globalAlpha = q; c.translate((1 - q) * 40, 0);
    txt(c, String(i + 1).padStart(2, '0'), 150, y, { size: 26, family: MONO, weight: 700, color: RED });
    txt(c, a, 220, y, { size: 32, weight: 700, color: PAL.paper });
    txt(c, b, 700, y, { size: 27, family: SERIF_F, weight: 400, color: alpha(PAL.paper, .66) });
    c.restore();
  });
  const f = sm(d - 26, d - 23, tau);
  txt(c, 'Todas las caras son ilustraciones, no fotografías. No se reproduce ningún escudo, logotipo ni marca.', CX, 1010, { size: 28, family: MONO, weight: 400, align: 'middle', color: alpha(PAL.paper, .5), p: f });
}

// ============================================================ timeline
defineFilm({
  palette: LOOK,
  format: { ar: '16:9', width: 1920 },
  fps: 12,
  score: null,
  timeline: [
    { name: 'apertura', dur: 36, fn: sOpen },
    { name: 'cap1', dur: 4, fn: sCard1 }, { name: 'gesto', dur: 96, fn: sGesto },
    { name: 'cap2', dur: 4, fn: sCard2 }, { name: 'medida', dur: 126, fn: sMedida },
    { name: 'cap3', dur: 4, fn: sCard3 }, { name: 'pleito', dur: 96, fn: sPleito },
    { name: 'cap4', dur: 4, fn: sCard4 }, { name: 'jugadores', dur: 106, fn: sJugadores },
    { name: 'cap5', dur: 4, fn: sCard5 }, { name: 'fe', dur: 126, fn: sFe },
    { name: 'cap6', dur: 4, fn: sCard6 }, { name: 'final', dur: 76, fn: sFinal },
    { name: 'fuentes', dur: 34, fn: sFuentes },
  ],
});
