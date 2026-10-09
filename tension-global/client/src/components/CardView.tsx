import { CARD, describeEffects, type CardId, type Era } from '@tg/shared';

export function CardView({
  id,
  era,
  selected,
  dim,
  onClick,
  mini,
}: {
  id: CardId;
  era: Era;
  selected?: boolean;
  dim?: boolean;
  onClick?: () => void;
  mini?: boolean;
}) {
  const c = CARD[id];
  if (!c) {
    return <div className="card back" aria-label="Carta oculta"><span>?</span></div>;
  }
  const owner = c.kind === 'score' ? 'score' : c.owner === 'W' ? 'w' : c.owner === 'E' ? 'e' : 'n';
  const lines = describeEffects(c, era);
  return (
    <button
      className={`card o-${owner}${selected ? ' selected' : ''}${dim ? ' dim' : ''}${mini ? ' mini' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="card-head">
        <span className="ops" title="Puntos de operaciones">{c.kind === 'score' ? '★' : c.ops}</span>
        <span className="card-year">{c.year}</span>
        <span className="card-owner">{c.kind === 'score' ? 'Puntuación' : c.owner === 'W' ? 'Occidente' : c.owner === 'E' ? 'Oriental' : 'Neutral'}</span>
      </div>
      <div className="card-name">{c.name}</div>
      {!mini && <div className="card-blurb">{c.blurb}</div>}
      <ul className="card-eff">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      {c.kind === 'ai' && <span className="tag ai">IA</span>}
    </button>
  );
}
