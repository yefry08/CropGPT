import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, C, Card, Chip, Hex, LevelBar, Muted, Pill, s, Screen, Title } from '../../components/ui';
import { CategoryKey, CATEGORIES, CATEGORY_LIST, SITES } from '../../lib/data';
import { distanceKm, status } from '../../lib/model';
import { useStore } from '../../lib/store';
import { openInMaps } from '../../lib/maps';

export default function Contenedores() {
  const st = useStore();
  const params = useLocalSearchParams<{ categoria?: string }>();
  const [filter, setFilter] = useState<CategoryKey | null>(null);

  useEffect(() => {
    if (params.categoria && params.categoria in CATEGORIES) setFilter(params.categoria as CategoryKey);
  }, [params.categoria]);

  const list = useMemo(
    () =>
      SITES.filter((x) => !filter || x.modules.includes(filter))
        .map((site) => ({ site, km: distanceKm(st.here, site) }))
        .sort((a, b) => a.km - b.km),
    [filter, st.here],
  );

  return (
    <Screen>
      <Title sub={st.position ? 'Ordenados por distancia a tu ubicación' : 'Distancias desde Santo Domingo'}>Contenedores cercanos</Title>
      {!st.position ? <Button kind="ghost" label="Usar mi ubicación" icon="navigate" onPress={st.locate} /> : null}
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        <Chip label="Todos" active={!filter} onPress={() => setFilter(null)} />
        {CATEGORY_LIST.map((c) => (
          <Chip key={c.key} label={c.name} color={c.color} active={filter === c.key} onPress={() => setFilter(c.key)} />
        ))}
      </View>

      {list.map(({ site, km }) => {
        const mods = st.modules.filter((m) => m.siteId === site.id && (!filter || m.category === filter));
        const shown = filter ? mods[0] : mods.reduce((a, b) => (b.full || b.level > a.level ? b : a), mods[0]);
        const following = st.following.includes(site.id);
        return (
          <Card key={site.id}>
            <Pressable onPress={() => router.push(`/contenedor/${site.id}`)} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.h2}>{site.name}</Text>
                <Muted>
                  {site.place} · {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
                </Muted>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </Pressable>
            <View style={[s.row, { flexWrap: 'wrap' }]}>
              {site.modules.map((k) => (
                <Hex key={k} color={CATEGORIES[k].color} icon={CATEGORIES[k].icon as never} size={26} />
              ))}
              <Muted style={{ marginLeft: 4 }}>
                {site.connectivity}
                {site.solar ? ' · solar' : ''}
              </Muted>
            </View>
            {shown ? (
              <>
                <Pill tone={status(shown).tone} text={`${filter ? CATEGORIES[shown.category].name + ': ' : ''}${status(shown).label}`} />
                <LevelBar level={shown.level} compacted={shown.compacted} color={CATEGORIES[shown.category].color} />
              </>
            ) : null}
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Button kind="ghost" label="Cómo llegar" icon="map-outline" onPress={() => openInMaps(site)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button kind={following ? 'ghost' : 'primary'} label={following ? 'Siguiendo' : 'Seguir'} icon={following ? 'checkmark' : 'add'} onPress={() => st.toggleFollow(site.id)} />
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
