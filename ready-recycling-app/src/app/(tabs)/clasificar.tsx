import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, C, Card, Chip, Hex, Muted, s, Screen, Title } from '../../components/ui';
import { CategoryKey, CATEGORIES, NOT_RECYCLABLE, QUESTIONS, QUICK_ITEMS } from '../../lib/data';

type Result = CategoryKey | 'resto';

export default function Clasificar() {
  const [path, setPath] = useState<string[]>(['start']);
  const [result, setResult] = useState<Result | null>(null);
  const q = QUESTIONS[path[path.length - 1]];

  const restart = () => {
    setPath(['start']);
    setResult(null);
  };

  return (
    <Screen>
      <Title sub="Responde y te decimos en qué módulo va">¿Dónde lo boto?</Title>

      {result ? (
        <ResultCard result={result} onRestart={restart} />
      ) : (
        <Card>
          <Text style={s.h2}>{q.text}</Text>
          {q.answers.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => (a.result ? setResult(a.result) : a.go && setPath([...path, a.go]))}
              style={({ pressed }) => [{ padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.line, backgroundColor: pressed ? C.brandSoft : '#fff', flexDirection: 'row', alignItems: 'center' }]}
            >
              <Text style={{ flex: 1, fontSize: 15, color: C.text, fontWeight: '600' }}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </Pressable>
          ))}
          {path.length > 1 ? <Button kind="ghost" label="Atrás" icon="arrow-back" onPress={() => setPath(path.slice(0, -1))} /> : null}
        </Card>
      )}

      <Title sub="Toca un residuo común">Respuestas rápidas</Title>
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        {QUICK_ITEMS.map((item) => (
          <Chip key={item.name} label={item.name} onPress={() => setResult(item.result)} />
        ))}
      </View>

      <Title sub="Cada módulo tiene su color y una boca con forma distinta">Los cinco módulos</Title>
      {Object.values(CATEGORIES).map((c) => (
        <Card key={c.key}>
          <View style={s.row}>
            <Hex color={c.color} icon={c.icon as never} />
            <View style={{ flex: 1 }}>
              <Text style={s.h2}>{c.name}</Text>
              <Muted>{c.mouth}</Muted>
            </View>
          </View>
          <Muted>{c.examples.join(' · ')}</Muted>
        </Card>
      ))}
    </Screen>
  );
}

function ResultCard({ result, onRestart }: { result: Result; onRestart: () => void }) {
  if (result === 'resto') {
    return (
      <Card style={{ borderColor: C.muted }}>
        <View style={s.row}>
          <Hex color="#6B7280" icon="trash-outline" />
          <Text style={[s.h2, { flex: 1 }]}>{NOT_RECYCLABLE.title}</Text>
        </View>
        <Muted>{NOT_RECYCLABLE.text}</Muted>
        <Button label="Clasificar otro residuo" icon="refresh" onPress={onRestart} />
      </Card>
    );
  }
  const c = CATEGORIES[result];
  return (
    <Card style={{ borderColor: c.color, borderWidth: 2 }}>
      <Muted>Va en el módulo</Muted>
      <View style={s.row}>
        <Hex color={c.color} icon={c.icon as never} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: c.color }}>{c.name}</Text>
          <Muted>{c.mouth} · color {colorName(result)}</Muted>
        </View>
      </View>
      <View style={[s.row, { alignItems: 'flex-start' }]}>
        <Ionicons name="bulb-outline" size={18} color={C.warn} />
        <Text style={{ flex: 1, color: C.text, lineHeight: 20 }}>{c.tip}</Text>
      </View>
      <Button label="Buscar el contenedor más cercano" icon="location" onPress={() => router.push({ pathname: '/contenedores', params: { categoria: result } })} />
      <Button kind="ghost" label="Clasificar otro residuo" icon="refresh" onPress={onRestart} />
    </Card>
  );
}

const colorName = (k: CategoryKey) => ({ plastico: 'amarillo', papel: 'azul', vidrio: 'verde', metal: 'rojo', organico: 'marrón' })[k];
