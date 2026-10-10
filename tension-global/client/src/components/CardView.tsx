import { CARD, cardBlurb, cardName, describeEffects, type CardId, type Era } from '@tg/shared';
import { useLang } from '../i18n';

export function CardView({ id, era, selected, dim, onClick }: { id: CardId; era: Era; selected?: boolean; dim?: boolean; onClick?: () => void }) {
  const { lang, tr } = useLang();
  const c = CARD[id];
  if (!c) {
    return (
      <div className="card back" aria-label={tr('Carta oculta', 'Hidden card')}>
        <span>?</span>
      </div>
    );
  }
  const owner = c.kind === 'score' ? 'score' : c.owner === 'W' ? 'w' : c.owner === 'E' ? 'e' : 'n';
  const ownerLabel =
    c.kind === 'score' ? tr('Puntuación', 'Scoring') : c.owner === 'W' ? tr('Occidente', 'West') : c.owner === 'E' ? tr('Oriental', 'Eastern') : tr('Neutral', 'Neutral');
  return (
    <button className={`card o-${owner}${selected ? ' selected' : ''}${dim ? ' dim' : ''}`} onClick={onClick} aria-pressed={selected}>
      <div className="card-head">
        <span className="ops" title={tr('Puntos de operaciones', 'Operations points')}>
          {c.kind === 'score' ? '★' : c.ops}
        </span>
        <span className="card-year">{c.year}</span>
        <span className="card-owner">{ownerLabel}</span>
      </div>
      <div className="card-name">{cardName(id, lang)}</div>
      <div className="card-blurb">{cardBlurb(id, lang)}</div>
      <ul className="card-eff">
        {describeEffects(c, era, lang).map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      {c.kind === 'ai' && <span className="tag ai">{tr('IA', 'AI')}</span>}
    </button>
  );
}
