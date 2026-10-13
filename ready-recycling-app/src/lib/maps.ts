import { Linking, Platform } from 'react-native';
import { Site } from './data';

export function openInMaps(site: Site) {
  const label = encodeURIComponent(site.name);
  const url =
    Platform.OS === 'android'
      ? `geo:${site.lat},${site.lng}?q=${site.lat},${site.lng}(${label})`
      : `https://maps.google.com/?q=${site.lat},${site.lng}`;
  Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${site.lat},${site.lng}`));
}
