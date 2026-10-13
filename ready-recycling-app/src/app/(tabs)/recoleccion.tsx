import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { Button, C, Card, Chip, Muted, s, Screen, Title } from '../../components/ui';
import { CategoryKey, CATEGORIES, CATEGORY_LIST, SITES, WEEKDAYS } from '../../lib/data';
import { weightKg } from '../../lib/model';
import { RequestStatus, useStore } from '../../lib/store';

const STEPS: { key: RequestStatus; label: string }[] = [
  { key: 'enviada', label: 'Enviada' },
  { key: 'asignada', label: 'Asignada' },
  { key: 'recolectada', label: 'Recolectada' },
];

function nextDays() {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(Date.now() + (i + 1) * 86400000);
    return d.toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' });
  });
}

export default function Recoleccion() {
  const st = useStore();
  const params = useLocalSearchParams<{ sitio?: string }>();
  const [siteId, setSiteId] = useState<string | undefined>(undefined);
  const [address, setAddress] = useState('');
  const [materials, setMaterials] = useState<CategoryKey[]>([]);
  const [volume, setVolume] = useState('');
  const [date, setDate] = useState(nextDays()[0]);
  const [notes, setNotes] = useState('');
  const [days, setDays] = useState<number[]>(st.reminders.days);
  const [hour, setHour] = useState(st.reminders.hour);

  // Prellenar desde el detalle de un contenedor.
  useEffect(() => {
    const site = SITES.find((x) => x.id === params.sitio);
    if (!site) return;
    setSiteId(site.id);
    setAddress(`${site.name}, ${site.place}`);
    const mods = st.modules.filter((m) => m.siteId === site.id && (m.full || m.level > 50));
    setMaterials(mods.map((m) => m.category));
    setVolume(mods.reduce((acc, m) => acc + weightKg(m), 0).toFixed(0));
  }, [params.sitio]);

  useEffect(() => {
    setDays(st.reminders.days);
    setHour(st.reminders.hour);
  }, [st.reminders]);

  const toggle = (k: CategoryKey) => setMaterials(materials.includes(k) ? materials.filter((m) => m !== k) : [...materials, k]);

  const submit = () => {
    const kg = Number(volume.replace(',', '.'));
    if (!address.trim() || !materials.length || !(kg > 0)) {
      Alert.alert('Faltan datos', 'Indica la dirección, al menos un material y el volumen estimado en kg.');
      return;
    }
    st.requestPickup({ siteId, address: address.trim(), materials, volumeKg: Math.round(kg), date, notes: notes.trim() });
    setSiteId(undefined);
    setAddress('');
    setMaterials([]);
    setVolume('');
    setNotes('');
    Alert.alert('Solicitud enviada', 'Te avisaremos cuando un centro de acopio la acepte.');
  };

  return (
    <Screen>
      <Title sub="Avisa a los centros de acopio qué recoger y dónde">Solicitar recolección</Title>
      <Card>
        <Text style={s.h2}>Dirección de recolección</Text>
        <TextInput style={s.input} value={address} onChangeText={setAddress} placeholder="Ej.: Liceo Público de Moca, Espaillat" placeholderTextColor={C.muted} />
        <Text style={s.h2}>Materiales</Text>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          {CATEGORY_LIST.map((c) => (
            <Chip key={c.key} label={c.name} color={c.color} active={materials.includes(c.key)} onPress={() => toggle(c.key)} />
          ))}
        </View>
        <Text style={s.h2}>Volumen estimado (kg)</Text>
        <TextInput style={s.input} value={volume} onChangeText={setVolume} keyboardType="numeric" placeholder="Ej.: 25" placeholderTextColor={C.muted} />
        <Text style={s.h2}>Fecha preferida</Text>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          {nextDays().map((d) => (
            <Chip key={d} label={d} active={date === d} onPress={() => setDate(d)} />
          ))}
        </View>
        <TextInput style={[s.input, { minHeight: 60 }]} value={notes} onChangeText={setNotes} placeholder="Notas para el recolector (opcional)" placeholderTextColor={C.muted} multiline />
        <Button label="Enviar solicitud" icon="send" onPress={submit} />
      </Card>

      <Title sub="Estado de tus solicitudes">Mis recolecciones</Title>
      {st.requests.length === 0 ? <Muted>Todavía no has solicitado recolecciones.</Muted> : null}
      {st.requests.map((r) => {
        const step = STEPS.findIndex((x) => x.key === r.status);
        return (
          <Card key={r.id}>
            <View style={s.row}>
              <Ionicons name="cube-outline" size={20} color={C.brand} />
              <Text style={[s.h2, { flex: 1 }]}>{r.address}</Text>
            </View>
            <Muted>
              {r.materials.map((m) => CATEGORIES[m].name).join(', ')} · {r.volumeKg} kg · {r.date}
            </Muted>
            {r.center ? <Muted>Centro asignado: {r.center}</Muted> : null}
            <View style={[s.row, { gap: 6 }]}>
              {STEPS.map((x, i) => (
                <View key={x.key} style={{ flex: 1, gap: 4 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: i <= step ? C.brand : C.line }} />
                  <Text style={{ fontSize: 12, color: i <= step ? C.brand : C.muted, fontWeight: '700' }}>{x.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        );
      })}

      <Title sub="Elige los días en que quieres un aviso">Recordatorios</Title>
      <Card>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          {WEEKDAYS.map((d) => (
            <Chip key={d.value} label={d.label} active={days.includes(d.value)} onPress={() => setDays(days.includes(d.value) ? days.filter((x) => x !== d.value) : [...days, d.value])} />
          ))}
        </View>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          {[7, 12, 17, 20].map((h) => (
            <Chip key={h} label={`${h}:00`} active={hour === h} onPress={() => setHour(h)} />
          ))}
        </View>
        <Muted>
          {st.reminders.days.length
            ? `Activo: ${st.reminders.days.map((v) => WEEKDAYS.find((d) => d.value === v)?.name).join(', ')} a las ${st.reminders.hour}:00`
            : 'Sin recordatorios programados.'}
        </Muted>
        <Button
          label="Guardar recordatorios"
          icon="alarm-outline"
          onPress={async () => {
            await st.setReminders([...days].sort(), hour);
            Alert.alert('Listo', days.length ? 'Recordatorios programados.' : 'Recordatorios desactivados.');
          }}
        />
      </Card>
    </Screen>
  );
}
