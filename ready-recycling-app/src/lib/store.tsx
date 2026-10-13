import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState } from 'react-native';
import { CATEGORIES, CategoryKey, COLLECTION_CENTERS, Prize, SITES } from './data';
import { compactNow, emptied, initialModules, ModuleState, moduleId, tick } from './model';
import { cancelReminders, notifyNow, scheduleReminders, setupNotifications } from './notify';

export type Deposit = { id: string; at: number; category: CategoryKey; units: number; points: number; siteId?: string };
export type Redemption = { id: string; at: number; prize: string; cost: number };
export type RequestStatus = 'enviada' | 'asignada' | 'recolectada';
export type PickupRequest = {
  id: string;
  createdAt: number;
  siteId?: string;
  address: string;
  materials: CategoryKey[];
  volumeKg: number;
  date: string;
  notes: string;
  status: RequestStatus;
  center?: string;
  updatedAt: number;
};
export type Reminders = { days: number[]; hour: number; ids: string[] };

type State = {
  ready: boolean;
  modules: ModuleState[];
  following: string[];
  points: number;
  deposits: Deposit[];
  redemptions: Redemption[];
  requests: PickupRequest[];
  reminders: Reminders;
  speed: number; // multiplicador de la demostración
  notificationsOn: boolean;
  position: { lat: number; lng: number } | null;
  alerts: { id: string; at: number; text: string }[];
};

const DEFAULT_POSITION = { lat: 18.4861, lng: -69.9312 }; // Santo Domingo

const initial: State = {
  ready: false,
  modules: initialModules(SITES),
  following: ['dia-lab', 'liceo-moca'],
  points: 120,
  deposits: [],
  redemptions: [],
  requests: [],
  reminders: { days: [], hour: 8, ids: [] },
  speed: 1,
  notificationsOn: false,
  position: null,
  alerts: [],
};

type Action =
  | { type: 'hydrate'; state: Partial<State> }
  | { type: 'modules'; modules: ModuleState[] }
  | { type: 'alert'; text: string }
  | { type: 'follow'; siteId: string }
  | { type: 'deposit'; deposit: Deposit }
  | { type: 'redeem'; redemption: Redemption }
  | { type: 'request'; request: PickupRequest }
  | { type: 'requests'; requests: PickupRequest[] }
  | { type: 'reminders'; reminders: Reminders }
  | { type: 'speed'; speed: number }
  | { type: 'notifications'; on: boolean }
  | { type: 'position'; position: { lat: number; lng: number } }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.state, ready: true };
    case 'modules':
      return { ...state, modules: action.modules };
    case 'alert':
      return { ...state, alerts: [{ id: `${Date.now()}-${Math.random()}`, at: Date.now(), text: action.text }, ...state.alerts].slice(0, 30) };
    case 'follow':
      return { ...state, following: state.following.includes(action.siteId) ? state.following.filter((s) => s !== action.siteId) : [...state.following, action.siteId] };
    case 'deposit':
      return { ...state, points: state.points + action.deposit.points, deposits: [action.deposit, ...state.deposits].slice(0, 200) };
    case 'redeem':
      return { ...state, points: state.points - action.redemption.cost, redemptions: [action.redemption, ...state.redemptions] };
    case 'request':
      return { ...state, requests: [action.request, ...state.requests] };
    case 'requests':
      return { ...state, requests: action.requests };
    case 'reminders':
      return { ...state, reminders: action.reminders };
    case 'speed':
      return { ...state, speed: action.speed };
    case 'notifications':
      return { ...state, notificationsOn: action.on };
    case 'position':
      return { ...state, position: action.position };
    case 'reset':
      return { ...initial, ready: true, notificationsOn: state.notificationsOn, position: state.position };
  }
}

const KEY = 'ready-recycling/v1';
const PERSISTED: (keyof State)[] = ['modules', 'following', 'points', 'deposits', 'redemptions', 'requests', 'reminders', 'speed', 'alerts'];

type Store = State & {
  here: { lat: number; lng: number };
  toggleFollow: (siteId: string) => void;
  addDeposit: (category: CategoryKey, units: number, siteId?: string) => number;
  redeem: (prize: Prize) => boolean;
  requestPickup: (r: Omit<PickupRequest, 'id' | 'createdAt' | 'status' | 'updatedAt'>) => void;
  setReminders: (days: number[], hour: number) => Promise<void>;
  setSpeed: (speed: number) => void;
  compact: (id: string) => void;
  markEmptied: (siteId: string) => void;
  enableNotifications: () => Promise<boolean>;
  locate: () => Promise<void>;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => dispatch({ type: 'hydrate', state: raw ? JSON.parse(raw) : {} }))
      .catch(() => dispatch({ type: 'hydrate', state: {} }));
    setupNotifications().then((on) => dispatch({ type: 'notifications', on })).catch(() => undefined);
  }, []);

  // Guardar el estado (cada 2 s como máximo).
  useEffect(() => {
    if (!state.ready) return;
    const t = setTimeout(() => {
      const out: Partial<State> = {};
      PERSISTED.forEach((k) => ((out as Record<string, unknown>)[k] = state[k]));
      AsyncStorage.setItem(KEY, JSON.stringify(out)).catch(() => undefined);
    }, 2000);
    return () => clearTimeout(t);
  }, [state]);

  // Telemetría simulada de los contenedores mientras la app está abierta.
  useEffect(() => {
    if (!state.ready) return;
    let active = AppState.currentState === 'active';
    const sub = AppState.addEventListener('change', (s) => (active = s === 'active'));
    const STEP = 3;
    const timer = setInterval(() => {
      if (!active) return;
      const s = ref.current;
      const { modules, events } = tick(s.modules, STEP, s.speed);
      dispatch({ type: 'modules', modules });
      for (const e of events) {
        const site = SITES.find((x) => x.id === e.module.siteId);
        const name = `${CATEGORIES[e.module.category].name} · ${site?.name ?? ''}`;
        if (e.type === 'full') {
          dispatch({ type: 'alert', text: `${name}: lleno, alerta enviada al centro de acopio` });
          if (s.following.includes(e.module.siteId)) notifyNow('Contenedor lleno', `${name} está lleno. Programa la recolección.`);
        } else if (e.type === 'hot') {
          dispatch({ type: 'alert', text: `${name}: temperatura alta (${e.module.tempC.toFixed(0)} °C)` });
          notifyNow('Riesgo de incendio', `${name} registra ${e.module.tempC.toFixed(0)} °C.`);
        }
      }
      // Avance de las solicitudes de recolección.
      const now = Date.now();
      let changed = false;
      const requests = s.requests.map((r) => {
        if (r.status === 'enviada' && now - r.updatedAt > 20000) {
          changed = true;
          const center = COLLECTION_CENTERS[Math.floor(Math.random() * COLLECTION_CENTERS.length)];
          notifyNow('Recolección asignada', `${center} atenderá tu solicitud.`);
          return { ...r, status: 'asignada' as const, center, updatedAt: now };
        }
        if (r.status === 'asignada' && now - r.updatedAt > 40000) {
          changed = true;
          notifyNow('Materiales recolectados', `${r.center} confirmó la recolección de ${r.volumeKg} kg.`);
          return { ...r, status: 'recolectada' as const, updatedAt: now };
        }
        return r;
      });
      if (changed) {
        dispatch({ type: 'requests', requests });
        const done = requests.filter((r, i) => r.status === 'recolectada' && s.requests[i].status !== 'recolectada' && r.siteId);
        if (done.length) {
          const sites = new Set(done.map((r) => r.siteId));
          dispatch({ type: 'modules', modules: ref.current.modules.map((m) => (sites.has(m.siteId) && m.full ? emptied(m) : m)) });
        }
      }
    }, STEP * 1000);
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [state.ready]);

  const locate = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      dispatch({ type: 'position', position: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
    } catch {
      // se usa Santo Domingo como referencia
    }
  }, []);

  const store = useMemo<Store>(
    () => ({
      ...state,
      here: state.position ?? DEFAULT_POSITION,
      toggleFollow: (siteId) => dispatch({ type: 'follow', siteId }),
      addDeposit: (category, units, siteId) => {
        const points = units * CATEGORIES[category].pointsPerUnit;
        dispatch({ type: 'deposit', deposit: { id: `${Date.now()}`, at: Date.now(), category, units, points, siteId } });
        return points;
      },
      redeem: (prize) => {
        if (ref.current.points < prize.cost) return false;
        dispatch({ type: 'redeem', redemption: { id: `${Date.now()}`, at: Date.now(), prize: prize.name, cost: prize.cost } });
        return true;
      },
      requestPickup: (r) => {
        const now = Date.now();
        dispatch({ type: 'request', request: { ...r, id: `${now}`, createdAt: now, status: 'enviada', updatedAt: now } });
        notifyNow('Solicitud enviada', 'Buscando el centro de acopio más cercano.');
      },
      setReminders: async (days, hour) => {
        await cancelReminders(ref.current.reminders.ids);
        const ids = days.length ? await scheduleReminders(days, hour) : [];
        dispatch({ type: 'reminders', reminders: { days, hour, ids } });
      },
      setSpeed: (speed) => dispatch({ type: 'speed', speed }),
      compact: (id) => dispatch({ type: 'modules', modules: ref.current.modules.map((m) => (moduleId(m) === id ? compactNow(m) : m)) }),
      markEmptied: (siteId) => dispatch({ type: 'modules', modules: ref.current.modules.map((m) => (m.siteId === siteId ? emptied(m) : m)) }),
      enableNotifications: async () => {
        const on = await setupNotifications();
        dispatch({ type: 'notifications', on });
        return on;
      },
      locate,
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state, locate],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fuera de StoreProvider');
  return s;
}
