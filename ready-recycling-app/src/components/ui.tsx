import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export const C = {
  brand: '#1F8A4C',
  brandDark: '#0E3B2A',
  brandSoft: '#E3F2E8',
  bg: '#F4F7F2',
  card: '#FFFFFF',
  text: '#16231B',
  muted: '#5D6B62',
  line: '#DDE5DE',
  warn: '#C98A0B',
  danger: '#C2362B',
};

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={s.title}>{children}</Text>
      {sub ? <Text style={s.muted}>{sub}</Text> : null}
    </View>
  );
}

export function Muted({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}

export function Button({ label, onPress, icon, kind = 'primary', disabled }: { label: string; onPress: () => void; icon?: IconName; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean }) {
  const bg = kind === 'primary' ? C.brand : kind === 'danger' ? C.danger : 'transparent';
  const fg = kind === 'ghost' ? C.brand : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.button, { backgroundColor: bg, borderColor: kind === 'ghost' ? C.brand : bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
  const tint = color ?? C.brand;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }} style={[s.chip, { borderColor: active ? tint : C.line, backgroundColor: active ? tint : C.card }]}>
      <Text style={{ color: active ? '#fff' : C.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function LevelBar({ level, compacted, color }: { level: number; compacted: number; color: string }) {
  return (
    <View style={s.bar} accessibilityLabel={`Nivel ${Math.round(level)} por ciento`}>
      <View style={[s.barFill, { width: `${Math.min(100, level)}%`, backgroundColor: color, opacity: 0.45 }]} />
      <View style={[s.barFill, { width: `${Math.min(100, compacted)}%`, backgroundColor: color }]} />
      <View style={[s.barMark, { left: '85%' }]} />
    </View>
  );
}

export function Stat({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <View style={s.stat}>
      <Ionicons name={icon} size={18} color={C.brand} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function Hex({ color, icon, size = 44 }: { color: string; icon: IconName; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: color, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '0deg' }] }}>
      <Ionicons name={icon} size={size * 0.5} color="#fff" />
    </View>
  );
}

export function Pill({ text, tone }: { text: string; tone: 'ok' | 'warn' | 'full' }) {
  const color = tone === 'ok' ? C.brand : tone === 'warn' ? C.warn : C.danger;
  return (
    <View style={[s.pill, { backgroundColor: color + '1A' }]}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{text}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: C.line },
  title: { fontSize: 20, fontWeight: '800', color: C.text },
  h2: { fontSize: 16, fontWeight: '700', color: C.text },
  muted: { color: C.muted, fontSize: 14, lineHeight: 20 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5 },
  buttonText: { fontWeight: '700', fontSize: 15 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5 },
  bar: { height: 12, borderRadius: 6, backgroundColor: '#EEF2EE', overflow: 'hidden', position: 'relative' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 6 },
  barMark: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#16231B55' },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 12, gap: 2, borderWidth: 1, borderColor: C.line },
  statValue: { fontSize: 20, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 12, color: C.muted },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { borderWidth: 1.5, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: C.text, backgroundColor: '#fff' },
});
