import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { C, IconName } from '../../components/ui';

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={icon} size={size} color={color} />,
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.muted,
        headerStyle: { backgroundColor: C.brandDark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ ...tab('Panel', 'grid-outline'), headerTitle: 'Ready Recycling' }} />
      <Tabs.Screen name="clasificar" options={tab('Clasificar', 'help-circle-outline')} />
      <Tabs.Screen name="contenedores" options={tab('Contenedores', 'location-outline')} />
      <Tabs.Screen name="recoleccion" options={tab('Recolección', 'car-outline')} />
      <Tabs.Screen name="recompensas" options={tab('Recompensas', 'trophy-outline')} />
    </Tabs>
  );
}
