import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, C, Card, Hex, IconName, LevelBar, Muted, Pill, s, Screen, Title } from '../../components/ui';
import { CATEGORIES, SITES } from '../../lib/data';
import { bottlesEquivalent, COMPACT_AT, distanceKm, FULL_AT, moduleId, status, tofDistance, weightKg } from '../../lib/model';
import { openInMaps } from '../../lib/maps';
import { useStore } from '../../lib/store';

export default function Contenedor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useStore();
  const site = SITES.find((x) => x.id === id);
  if (!site) return <Muted>Contenedor no encontrado.</Muted>;
  const mods = st.modules.filter((m) => m.siteId === site.id);
  const following = st.following.includes(site.id);
  const anyFull = mods.some((m) => m.full);
  const ago = (t: number) => {
    const s2 = Math.max(0, Math.round((Date.now() - t) / 1000));
    return s2 < 60 ? `hace ${s2} s` : s2 < 3600 ? `hace ${Math.round(s2 / 60)} min` : s2 < 86400 ? `hace ${Math.round(s2 / 3600)} h` : `hace ${Math.round(s2 / 86400)} d`;
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: site.name }} />
      <Card>
        <Title sub={`${site.place} · ${distanceKm(st.here, site).toFixed(1)} km`}>{site.name}</Title>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          <Info icon="wifi" text={site.connectivity} />
          <Info icon={site.solar ? 'sunny-outline' : 'flash-outline'} text={site.solar ? 'Panel solar + batería' : 'Corriente directa'} />
          <Info icon="hardware-chip-outline" text="ESP32" />
        </View>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Button kind="ghost" label="Cómo llegar" icon="map-outline" onPress={() => openInMaps(site)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button kind={following ? 'ghost' : 'primary'} label={following ? 'Siguiendo' : 'Seguir'} icon={following ? 'notifications' : 'notifications-outline'} onPress={() => st.toggleFollow(site.id)} />
          </View>
        </View>
        <Button kind={anyFull ? 'primary' : 'ghost'} label="Solicitar recolección" icon="car-outline" onPress={() => router.push({ pathname: '/recoleccion', params: { sitio: site.id } })} />
      </Card>

      {mods.map((m) => {
        const c = CATEGORIES[m.category];
        const st2 = status(m);
        return (
          <Card key={m.category}>
            <View style={s.row}>
              <Hex color={c.color} icon={c.icon as never} />
              <View style={{ flex: 1 }}>
                <Text style={s.h2}>{c.name}</Text>
                <Muted>{c.mouth}</Muted>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: m.full ? C.danger : C.text }}>{Math.round(m.level)} %</Text>
            </View>
            <Pill tone={st2.tone} text={st2.label} />
            <LevelBar level={m.level} compacted={m.compacted} color={c.color} />
            <Muted style={{ fontSize: 12 }}>
              Tono fuerte: compactado ({Math.round(m.compacted)} %). La marca indica el {COMPACT_AT} % en que se activa la placa. Lleno al {FULL_AT} % compactado.
            </Muted>
            <View style={[s.row, { flexWrap: 'wrap' }]}>
              <Metric label="Sensor ToF" value={`${tofDistance(m)} cm`} />
              <Metric label="Peso" value={`${weightKg(m).toFixed(1)} kg`} />
              <Metric label="Temperatura" value={`${m.tempC.toFixed(1)} °C`} warn={m.tempC > 45} />
              <Metric label="Batería" value={`${Math.round(m.battery)} %`} warn={m.battery < 25} />
              <Metric label="Ciclos" value={`${m.cycles}`} />
              {m.category === 'plastico' ? <Metric label="≈ botellas" value={`${bottlesEquivalent(m)}`} /> : null}
            </View>
            <Muted style={{ fontSize: 12 }}>
              Último reporte {ago(m.lastReport)} · vaciado {ago(m.lastEmptied)}
            </Muted>
            <Button kind="ghost" label="Compactar ahora" icon="contract-outline" disabled={m.full || m.level - m.compacted < 2} onPress={() => st.compact(moduleId(m))} />
          </Card>
        );
      })}

      <Button kind="ghost" label="Marcar como vaciado (personal del centro)" icon="checkmark-done" onPress={() => st.markEmptied(site.id)} />
    </Screen>
  );
}

function Info({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={[s.row, { gap: 4, backgroundColor: C.brandSoft, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 }]}>
      <Ionicons name={icon} size={14} color={C.brand} />
      <Text style={{ color: C.brandDark, fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={{ width: '31%', minWidth: 90, backgroundColor: C.bg, borderRadius: 10, padding: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: warn ? C.danger : C.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: C.muted }}>{label}</Text>
    </View>
  );
}
