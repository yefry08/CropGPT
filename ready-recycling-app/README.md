# Ready Recycling — app móvil (Expo)

App Android/iOS para el sistema de contenedores inteligentes de Ready Recycling. Se basa en la documentación del proyecto en Drive: el documento "ready" (sección *App*), el *Plan de proyecto* y el *Business Report*.

## Funciones

| Pestaña | Qué hace | De dónde sale |
|---|---|---|
| **Panel** | Puntos, kg reciclados, telemetría en vivo de los Readys que sigues y alertas recientes | "Interrelación con aplicación móvil: monitoreo a tiempo real del estado de los zafacones" |
| **Clasificar** | Guía con preguntas que dice en qué módulo va cada residuo (color y forma de la boca), más respuestas rápidas | "Interfaz intuitiva … guiada por una serie de preguntas … mostrar una imagen del contenedor correspondiente" |
| **Contenedores** | Lista ordenada por distancia (geolocalización), filtro por tipo de residuo, cómo llegar y seguir un contenedor | "Función de geolocalización para encontrar el contenedor más cercano" |
| **Detalle** | Por módulo: nivel (sensor ToF), compactado, peso (celdas de carga), temperatura, batería y ciclos de compactación | Componentes del zafacón inteligente |
| **Recolección** | Solicitud a centros de acopio (dirección, materiales, volumen, fecha), seguimiento Enviada → Asignada → Recolectada y recordatorios semanales | Puntos 2, 3, 5 y 6 de la sección *App* |
| **Recompensas** | Registro de reciclaje con puntos, canje de premios y ranking entre centros educativos | "Función de recompensas" y competencias entre centros educativos |

Las notificaciones locales avisan cuando se llena un contenedor que sigues, cuando hay riesgo de incendio (temperatura) y cuando cambia el estado de una recolección.

## Datos de demostración

Todavía no hay un backend que reciba la telemetría de los ESP32, así que `src/lib/model.ts` la simula. Usa los mismos umbrales del prototipo: compacta al 85 %, reduce lo suelto un 65 % y declara el módulo lleno con el 68 % compactado. El Panel tiene un selector ×1/×3/×10 para acelerar la simulación.

La red de contenedores (`src/lib/data.ts`) usa ubicaciones de los aliados del proyecto (DIA Lab, ADASEC, MINERD Espaillat). Para conectar datos reales, reemplaza el `tick` del `StoreProvider` en `src/lib/store.tsx` por una consulta a tu API o a un broker MQTT.

## Desarrollo

```bash
npm install
npx expo start            # Expo Go / emulador
npx tsc --noEmit          # typecheck
```

## Compilar el APK

Con EAS (en la nube):

```bash
npx eas-cli@latest build -p android --profile preview
```

En local (requiere Android SDK + NDK y JDK 17–21):

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

El APK de release generado así va firmado con la clave de depuración. Sirve para instalarlo directamente, pero no para publicarlo en Google Play. Para la tienda, configura una clave de subida propia o usa EAS.
