import { useEffect, useState } from 'react';
import { Home, type Start } from './components/Home';
import { GameScreen } from './components/GameScreen';
import { Lobby } from './components/Lobby';
import { clearSave, loadSave, useLocalGame, type SavedGame } from './hooks/useLocalGame';
import { clearToken, getToken, useOnline, type Intent } from './hooks/useOnline';

function SoloGame({ start, onExit }: { start: Extract<Start, { t: 'solo' }>; onExit: () => void }) {
  const [resume] = useState<SavedGame | null>(() => (start.resume ? loadSave() : null));
  const side = resume?.side ?? start.side;
  const level = resume?.level ?? start.level;
  const ctrl = useLocalGame(side, level, resume);
  return (
    <GameScreen
      ctrl={ctrl}
      onExit={() => {
        if (ctrl.state.phase === 'over') clearSave();
        onExit();
      }}
    />
  );
}

function OnlineGame({ intent, onExit }: { intent: Intent; onExit: () => void }) {
  const o = useOnline(intent);
  const leave = () => {
    if (o.state?.phase === 'over') o.leave();
    const url = new URL(location.href);
    url.searchParams.delete('sala');
    url.searchParams.delete('espectador');
    history.replaceState(null, '', url);
    onExit();
  };
  if (o.status === 'error' && !o.state) {
    return (
      <div className="home">
        <div className="panel center">
          <h2>No se pudo entrar</h2>
          <p>{o.error}</p>
          <button
            className="primary"
            onClick={() => {
              if (o.code) clearToken(o.code);
              leave();
            }}
          >
            Volver al menú
          </button>
        </div>
      </div>
    );
  }
  if (o.controller && o.info?.started !== false) return <GameScreen ctrl={o.controller} onExit={leave} />;
  return (
    <Lobby
      info={o.info}
      role={o.role}
      chat={o.chat}
      connected={o.connected}
      error={o.status === 'connecting' && !o.connected ? 'Conectando…' : o.error}
      onSend={(t) => o.controller?.online?.sendChat(t)}
      onSide={o.chooseSide}
      onReady={o.setReady}
      onExit={leave}
    />
  );
}

export function App() {
  const params = new URLSearchParams(location.search);
  const urlCode = (params.get('sala') ?? '').toUpperCase();
  const urlSpec = params.get('espectador') === '1';
  const [screen, setScreen] = useState<Start | null>(() => {
    if (/^[A-Z0-9]{6}$/.test(urlCode)) {
      // Con token guardado se reingresa directamente; los enlaces de espectador también.
      let name = '';
      try {
        name = localStorage.getItem('tg-name') ?? '';
      } catch {
        /* ignorar */
      }
      if (getToken(urlCode) || urlSpec) return { t: 'join', code: urlCode, name: name || 'Espectador', spectator: urlSpec };
    }
    return null;
  });

  useEffect(() => {
    document.title = 'Tensión Global';
  }, []);

  if (!screen) return <Home onStart={setScreen} initialCode={/^[A-Z0-9]{6}$/.test(urlCode) ? urlCode : undefined} />;
  if (screen.t === 'solo') return <SoloGame start={screen} onExit={() => setScreen(null)} />;
  const intent: Intent = screen.t === 'create' ? screen : { t: 'join', code: screen.code, name: screen.name, spectator: screen.spectator };
  return <OnlineGame key={screen.t === 'join' ? screen.code : 'new'} intent={intent} onExit={() => setScreen(null)} />;
}
