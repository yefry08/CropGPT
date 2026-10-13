import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CHANNEL = 'alertas';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Alertas de contenedores y recolección',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 200, 250],
      lightColor: '#1F8A4C',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.status === 'granted';
}

export async function notifyNow(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {
    // sin permiso: la alerta sigue visible dentro de la app
  }
}

// Recordatorios semanales: weekday va de 1 (domingo) a 7 (sábado).
export async function scheduleReminders(days: number[], hour: number): Promise<string[]> {
  const ids: string[] = [];
  for (const weekday of days) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'Ready Recycling', body: 'Recordatorio: revisa tus contenedores y programa la recolección.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute: 0, channelId: CHANNEL },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelReminders(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
}
