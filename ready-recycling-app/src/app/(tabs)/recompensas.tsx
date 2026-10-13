import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, C, Card, Chip, Muted, s, Screen, Title } from '../../components/ui';
import { CategoryKey, CATEGORIES, CATEGORY_LIST, LEADERBOARD, PRIZES } from '../../lib/data';
import { useStore } from '../../lib/store';

export default function Recompensas() {
  const st = useStore();
  const [category, setCategory] = useState<CategoryKey>('plastico');
  const [units, setUnits] = useState(5);
  const c = CATEGORIES[category];

  return (
    <Screen>
      <Card style={{ backgroundColor: C.brandDark, borderColor: C.brandDark, alignItems: 'center' }}>
        <Ionicons name="trophy" size={32} color="#F5C542" />
        <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800' }}>{st.points}</Text>
        <Text style={{ color: '#CFE8D7' }}>puntos disponibles</Text>
      </Card>

      <Title sub="Suma puntos cada vez que depositas en un módulo Ready">Registrar reciclaje</Title>
      <Card>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          {CATEGORY_LIST.map((x) => (
            <Chip key={x.key} label={x.name} color={x.color} active={category === x.key} onPress={() => setCategory(x.key)} />
          ))}
        </View>
        <View style={[s.row, { justifyContent: 'center', gap: 20 }]}>
          <Button kind="ghost" label="−" onPress={() => setUnits(Math.max(1, units - 1))} />
          <Text style={{ fontSize: 28, fontWeight: '800', color: C.text, minWidth: 50, textAlign: 'center' }}>{units}</Text>
          <Button kind="ghost" label="+" onPress={() => setUnits(units + 1)} />
        </View>
        <Muted style={{ textAlign: 'center' }}>
          unidades · {c.pointsPerUnit} pts c/u = {units * c.pointsPerUnit} puntos
        </Muted>
        <Button
          label="Registrar"
          icon="add-circle-outline"
          onPress={() => {
            const pts = st.addDeposit(category, units);
            Alert.alert('¡Gracias por reciclar!', `Ganaste ${pts} puntos.`);
          }}
        />
      </Card>

      <Title sub="Canjea tus puntos">Premios</Title>
      {PRIZES.map((p) => (
        <Card key={p.id}>
          <View style={s.row}>
            <Ionicons name={p.icon as never} size={24} color={C.brand} />
            <View style={{ flex: 1 }}>
              <Text style={s.h2}>{p.name}</Text>
              <Muted>{p.cost} puntos</Muted>
            </View>
            <View style={{ width: 110 }}>
              <Button
                label="Canjear"
                disabled={st.points < p.cost}
                onPress={() =>
                  Alert.alert('Canjear premio', `¿Usar ${p.cost} puntos en "${p.name}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Canjear', onPress: () => st.redeem(p) && Alert.alert('Premio canjeado', 'Te contactaremos para la entrega.') },
                  ])
                }
              />
            </View>
          </View>
        </Card>
      ))}

      <Title sub="Competencia entre centros educativos de la temporada">Ranking</Title>
      <Card>
        {LEADERBOARD.map((row, i) => (
          <View key={row.name} style={s.row}>
            <Text style={{ width: 24, fontWeight: '800', color: i === 0 ? '#C99A06' : C.muted }}>{i + 1}</Text>
            <Text style={{ flex: 1, color: C.text, fontWeight: '600' }}>{row.name}</Text>
            <Text style={{ color: C.brand, fontWeight: '800' }}>{row.points}</Text>
          </View>
        ))}
      </Card>

      <Title>Historial</Title>
      <Card>
        {st.deposits.length + st.redemptions.length === 0 ? <Muted>Aún no hay movimientos.</Muted> : null}
        {[...st.deposits.map((d) => ({ at: d.at, text: `${d.units} × ${CATEGORIES[d.category].name}`, pts: `+${d.points}` })), ...st.redemptions.map((r) => ({ at: r.at, text: r.prize, pts: `−${r.cost}` }))]
          .sort((a, b) => b.at - a.at)
          .slice(0, 15)
          .map((row) => (
            <View key={`${row.at}${row.text}`} style={s.row}>
              <Text style={{ flex: 1, color: C.text }}>{row.text}</Text>
              <Muted>{new Date(row.at).toLocaleDateString('es-DO')}</Muted>
              <Text style={{ width: 56, textAlign: 'right', fontWeight: '800', color: row.pts.startsWith('+') ? C.brand : C.danger }}>{row.pts}</Text>
            </View>
          ))}
      </Card>
    </Screen>
  );
}
