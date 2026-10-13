import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, C, Card, Chip, Hex, LevelBar, Muted, Pill, s, Screen, Stat, Title } from '../../components/ui';
import { CATEGORIES, SITES } from '../../lib/data';
import { status, weightKg } from '../../lib/model';
import { useStore } from '../../lib/store';

export default function Panel() {
  const st = useStore();
  const followed = SITES.filter((x) => st.following.includes(x.id));
  const full = st.modules.filter((m) => m.full).length;
  const recycledKg = st.deposits.reduce((acc, d) => acc + (d.units * CATEGORIES[d.category].gramsPerUnit) / 1000, 0);
  const totalKg = st.modules.reduce((acc, m) => acc + weightKg(m), 0);

  return (
    <Screen>
      <Card style={{ backgroundColor: C.brandDark, borderColor: C.brandDark }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Hola 👋</Text>
        <Text style={{ color: '#CFE8D7', fontSize: 14, lineHeight: 20 }}>
          Contenedores inteligentes que preclasifican, compactan y avisan al centro de acopio cuando están llenos.
        </Text>
        <View style={[s.row, { marginTop: 4 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{st.points}</Text>
            <Text style={{ color: '#CFE8D7', fontSize: 12 }}>puntos Ready</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{recycledKg.toFixed(1)}</Text>
            <Text style={{ color: '#CFE8D7', fontSize: 12 }}>kg que has reciclado</Text>
          </View>
        </View>
      </Card>

      {!st.notificationsOn ? (
        <Card style={{ borderColor: C.warn }}>
          <Text style={s.h2}>Activa las alertas</Text>
          <Muted>Te avisamos cuando un contenedor que sigues se llene o cuando tu recolección esté en camino.</Muted>
          <Button label="Activar notificaciones" icon="notifications-outline" onPress={st.enableNotifications} />
        </Card>
      ) : null}

      <View style={[s.row, { alignItems: 'stretch' }]}>
        <Stat icon="cube-outline" value={`${st.modules.length}`} label="módulos en la red" />
        <Stat icon="alert-circle-outline" value={`${full}`} label="llenos ahora" />
        <Stat icon="barbell-outline" value={`${totalKg.toFixed(0)} kg`} label="acumulado" />
      </View>

      <Title sub="Telemetría en vivo de los contenedores que sigues">Mis Readys</Title>
      {followed.length === 0 ? <Muted>Aún no sigues ningún contenedor. Búscalos en la pestaña Contenedores.</Muted> : null}
      {followed.map((site) => {
        const mods = st.modules.filter((m) => m.siteId === site.id);
        const worst = mods.reduce((a, b) => (b.full || b.level > a.level ? b : a), mods[0]);
        return (
          <Pressable key={site.id} onPress={() => router.push(`/contenedor/${site.id}`)}>
            <Card>
              <View style={s.row}>
                <Ionicons name="business-outline" size={20} color={C.brand} />
                <View style={{ flex: 1 }}>
                  <Text style={s.h2}>{site.name}</Text>
                  <Muted>{site.place}</Muted>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </View>
              <Pill {...status(worst)} text={status(worst).label} />
              {mods.map((m) => (
                <View key={m.category} style={{ gap: 4 }}>
                  <View style={s.row}>
                    <Hex color={CATEGORIES[m.category].color} icon={CATEGORIES[m.category].icon as never} size={24} />
                    <Text style={{ flex: 1, fontWeight: '600', color: C.text }}>{CATEGORIES[m.category].name}</Text>
                    <Text style={{ color: m.full ? C.danger : C.muted, fontWeight: '700' }}>{m.full ? 'LLENO' : `${Math.round(m.level)} %`}</Text>
                  </View>
                  <LevelBar level={m.level} compacted={m.compacted} color={CATEGORIES[m.category].color} />
                </View>
              ))}
            </Card>
          </Pressable>
        );
      })}

      <Title sub="Lo que reportan los sensores de la red">Alertas recientes</Title>
      <Card>
        {st.alerts.length === 0 ? <Muted>Sin alertas por ahora.</Muted> : null}
        {st.alerts.slice(0, 6).map((a) => (
          <View key={a.id} style={s.row}>
            <Ionicons name="notifications" size={16} color={C.warn} />
            <Text style={{ flex: 1, color: C.text }}>{a.text}</Text>
            <Muted>{new Date(a.at).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</Muted>
          </View>
        ))}
      </Card>

      <Title sub="Acelera la simulación para ver ciclos de compactación">Modo demostración</Title>
      <Card>
        <Muted>Mientras no haya contenedores conectados, la app simula la telemetría del ESP32: nivel por sensor ToF, peso, temperatura y batería.</Muted>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          {[1, 3, 10].map((v) => (
            <Chip key={v} label={`×${v}`} active={st.speed === v} onPress={() => st.setSpeed(v)} />
          ))}
        </View>
        <Button kind="ghost" label="Reiniciar datos de demostración" icon="refresh" onPress={st.reset} />
      </Card>
    </Screen>
  );
}
