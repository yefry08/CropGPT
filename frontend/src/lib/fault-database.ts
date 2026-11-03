export type FaultCategory = "riego" | "maquinaria" | "estructura" | "electrico" | "almacenamiento"

export const CATEGORY_META: Record<FaultCategory, { label: string; emoji: string }> = {
  riego:          { label: "Riego",          emoji: "💧" },
  maquinaria:     { label: "Maquinaria",     emoji: "🚜" },
  estructura:     { label: "Estructura",     emoji: "🏗️" },
  electrico:      { label: "Eléctrico",      emoji: "⚡" },
  almacenamiento: { label: "Almacenamiento", emoji: "🏪" },
}

export interface FaultStep { n: number; action: string; detail: string }

export interface FaultEntry {
  id: string
  category: FaultCategory
  name: string
  keywords: string[]
  symptoms: string[]
  severity: "baja" | "media" | "alta" | "crítica"
  causes: string[]
  immediate: string[]
  steps: FaultStep[]
  tools: string[]
  time: string
  prevention: string[]
}

export const FAULT_DATABASE: FaultEntry[] = [
  // ─── RIEGO ────────────────────────────────────────────────
  {
    id: "bomba-no-arranca",
    category: "riego",
    name: "Bomba de agua no arranca",
    keywords: ["bomba","no arranca","no enciende","riego","motor","agua","pump","sin agua"],
    symptoms: ["La bomba no produce ningún sonido","El motor zumba pero no gira","El disyuntor se dispara inmediatamente"],
    severity: "alta",
    causes: ["Fusible quemado o disyuntor disparado","Capacitor de arranque defectuoso","Bobinado del motor en cortocircuito","Eje de la bomba trabado por sedimentos","Falta de fase en la alimentación eléctrica"],
    immediate: ["Cortar el suministro eléctrico antes de inspeccionar","Verificar que la bomba no esté en seco (nivel de agua suficiente)","Revisar el tablero eléctrico y el disyuntor"],
    steps: [
      { n:1, action:"Seguridad eléctrica", detail:"Apagar el interruptor principal y colocar un aviso de 'Equipo en mantenimiento'. Esperar 2 minutos antes de tocar los terminales." },
      { n:2, action:"Revisar alimentación eléctrica", detail:"Con un multímetro verificar voltaje en bornes del tablero: debe haber 220 V ±5%. Si hay ausencia de fase, contactar a la empresa distribuidora." },
      { n:3, action:"Inspeccionar fusibles y disyuntor", detail:"Revisar el disyuntor termomagnético: si está disparado, resetear UNA vez. Si vuelve a dispararse, no volver a resetear — hay un cortocircuito aguas abajo." },
      { n:4, action:"Probar el capacitor de arranque", detail:"Desconectar el capacitor y medir capacitancia con el multímetro en modo 'CAP'. El valor debe estar ±10% del valor nominal impreso. Un capacitor abierto (0 µF) indica reemplazo." },
      { n:5, action:"Verificar giro manual del eje", detail:"Con la corriente cortada, intentar girar el eje de la bomba a mano. Si está trabado, retirar la voluta e inspeccionar: sedimentos, impeler dañado o eje doblado." },
      { n:6, action:"Medir resistencia del bobinado", detail:"Con el óhmetro entre terminales U-V, V-W, U-W: deben ser iguales (±5%). Entre cualquier terminal y tierra debe ser >1 MΩ. Valores bajos indican bobinado quemado — enviar a reparar." },
      { n:7, action:"Arranque de prueba", detail:"Con todo verificado, energizar y medir amperaje de arranque y de plena carga. El amperaje de plena carga no debe superar el valor nominal en la placa ±10%." },
    ],
    tools: ["Multímetro digital","Medidor de capacitancia","Destornilladores planos y Phillips","Llave ajustable","Equipo de protección eléctrica (guantes, zapatos dieléctricos)"],
    time: "2–4 horas",
    prevention: ["Revisar el capacitor cada 12 meses","Limpiar el filtro de entrada mensualmente","Instalar un protector de fases","Verificar nivel del pozo antes de arrancar"],
  },
  {
    id: "presion-baja-goteo",
    category: "riego",
    name: "Presión baja en sistema de goteo",
    keywords: ["presión","baja","goteo","poco caudal","goteros","no sale agua","riego por goteo","tubería"],
    symptoms: ["Goteros con flujo muy reducido","Zonas del cultivo sin regar","Manómetro por debajo de 0.8 bar"],
    severity: "alta",
    causes: ["Filtros de malla o disco obstruidos","Fuga en tubería principal o secundaria","Reguladores de presión descalibrados","Bomba con rodete desgastado","Válvulas parcialmente cerradas"],
    immediate: ["Inspeccionar visualmente el trayecto de tuberías buscando charcos o humedad inusual","Verificar manómetros en cabezal, primaria y secundaria para localizar la caída de presión"],
    steps: [
      { n:1, action:"Identificar el tramo con caída de presión", detail:"Colocar manómetros temporales a la salida de la bomba, tras el filtro principal, y en la cabecera de cada sector. La presión cae bruscamente en el tramo con el problema." },
      { n:2, action:"Limpiar filtros de malla y disco", detail:"Cerrar la válvula de entrada, aflojar el filtro, retirar el elemento filtrante y lavarlo con agua limpia. Si el disco tiene calcificación, sumergir 15 min en ácido cítrico diluido (10 g/L). Reinstalar y verificar presión." },
      { n:3, action:"Buscar fugas en tuberías", detail:"Cerrar todos los sectores y observar si el manómetro a la salida de la bomba cae. Si cae, hay una fuga. Caminar el trayecto buscando zonas húmedas o surgentes. Reparar con fitting de unión rápida." },
      { n:4, action:"Revisar reguladores de presión", detail:"Con el manómetro aguas abajo, ajustar el regulador hasta alcanzar 1.0–1.5 bar (según diseño). Los reguladores de membrana desgastados no se reparan — reemplazar." },
      { n:5, action:"Inspeccionar goteros obstruidos masivamente", detail:"Si la presión es correcta pero el caudal es bajo, purgar el sistema: abrir los extremos de cada línea lateral y dejar correr 2 minutos. Luego inyectar solución de ácido cítrico (20 g/L) y dejar actuar 1 hora." },
      { n:6, action:"Verificar rodete de la bomba", detail:"Si la presión en la descarga de la bomba es baja con válvulas abiertas, desmontarla e inspeccionar el rodete: desgaste, fractura o corrosión reducen el caudal y la presión. Reemplazar si aplica." },
    ],
    tools: ["Manómetros de glicerina (0–4 bar)","Llave de filtro","Ácido cítrico alimentario","Baldes limpios","Kit de reparación PVC o PE"],
    time: "3–6 horas",
    prevention: ["Limpiar filtros cada 2 semanas en temporada","Instalar manómetros permanentes en el cabezal","Aplicar ácido mensualmente para evitar calcificación"],
  },
  {
    id: "goteros-obstruidos",
    category: "riego",
    name: "Goteros obstruidos por calcificación o algas",
    keywords: ["gotero","obstruido","tapado","calcificación","alga","bio","no gotea","riego"],
    symptoms: ["Goteros sin salida de agua o caudal muy reducido","Depósito blanco o verdoso en los orificios","Cultivo con síntomas de estrés hídrico localizado"],
    severity: "media",
    causes: ["Agua con alta dureza (calcio > 200 mg/L)","Contaminación biológica (algas, hongos)","Partículas finas que pasaron el filtro","pH del agua > 7.5 precipita carbonatos"],
    immediate: ["Marcar las líneas afectadas","Abrir extremos de las laterales y purgar 2 minutos"],
    steps: [
      { n:1, action:"Purgar las líneas laterales", detail:"Abrir los tapones de extremo de cada lateral afectado. Dejar correr a presión 2 min. Esto elimina partículas sueltas." },
      { n:2, action:"Tratamiento con ácido cítrico", detail:"Preparar solución de 30 g ácido cítrico por litro. Inyectar en el cabezal con la bomba dosificadora hasta que salga por los extremos. Cerrar extremos, dejar actuar 2 horas, luego purgar con agua limpia." },
      { n:3, action:"Tratamiento de choque con hipoclorito (biológico)", detail:"Si hay algas o limo biológico, inyectar solución de cloro a 100 ppm (10 mL de hipoclorito 10% por 10 L agua). Dejar 4 horas y purgar. No mezclar con ácido." },
      { n:4, action:"Limpieza manual de goteros que no reaccionan", detail:"Retirar los goteros que siguen obstruidos, sumergir 30 min en ácido cítrico concentrado (50 g/L), limpiar con cepillo fino, reinstalar." },
      { n:5, action:"Ajustar pH del agua de riego", detail:"Si el pH supera 7.5, acidificar con ácido fosfórico o cítrico hasta pH 6.0–6.5 en el tanque de fertilización para reducir la precipitación de carbonatos." },
    ],
    tools: ["Ácido cítrico","Hipoclorito de sodio","Bomba dosificadora","Manómetro","Cepillo de cerdas finas","pHmetro"],
    time: "4–6 horas",
    prevention: ["Acidificar el agua de riego a pH 6.0–6.5","Filtrar con malla 120 mesh o más fino","Realizar purgas semanales de extremos"],
  },
  {
    id: "rotura-tuberia-principal",
    category: "riego",
    name: "Rotura en tubería principal de riego",
    keywords: ["tubería","rotura","ruptura","fuga","reventó","perdida","inundación","riego","pipe","agua"],
    symptoms: ["Charco o surgente de agua en la superficie","Caída brusca de presión en todo el sistema","Sonido de flujo subterráneo en zonas sin riego"],
    severity: "crítica",
    causes: ["Golpe de ariete por cierre brusco de válvula","Sobrepresión por válvula de alivio defectuosa","Daño mecánico por maquinaria","Envejecimiento o rayos UV en tubería expuesta","Helada en zonas altas de la RD (Constanza)"],
    immediate: ["CERRAR la válvula principal de suministro inmediatamente","Abrir válvulas de drenaje aguas abajo para liberar presión","Marcar la zona con estacas y acordonar si hay peligro de socavamiento"],
    steps: [
      { n:1, action:"Localizar exactamente la rotura", detail:"Con la tubería sin presión, inspeccionar el trayecto completo. Buscar el charco más grande o el burbujeo de tierra. Excavar 50 cm a cada lado del punto visible." },
      { n:2, action:"Cortar y limpiar el tramo dañado", detail:"Con sierra arco o cutter PVC, cortar 20 cm a cada lado de la rotura, dejando cortes perpendiculares y limpios. Limpiar el interior de los extremos con lija 80." },
      { n:3, action:"Seleccionar el tipo de reparación", detail:"Para tuberías PVC: usar manguito de reparación + cemento PVC. Para PE: usar fitting de compresión de reparación del mismo diámetro. Para tuberías de acero: usar collarín de reparación o brida." },
      { n:4, action:"Aplicar la reparación", detail:"PVC: aplicar imprimante, luego cemento PVC en ambas superficies, insertar el manguito con giro de ¼ vuelta. Sostener 30 s. Esperar 24 h antes de presurizar. PE: insertar fitting de compresión sin adhesivo; apretar a mano y ½ vuelta con llave." },
      { n:5, action:"Prueba hidráulica", detail:"Abrir lentamente la válvula principal hasta alcanzar la presión de operación. Inspeccionar la reparación sin tocarla durante 30 min. Si hay sudoración, reforzar con collarín de abrazadera." },
      { n:6, action:"Rellenar y compactar la zanja", detail:"Rellenar con material fino libre de piedras. Compactar cada 20 cm. No usar compactador mecánico sobre la tubería directamente." },
    ],
    tools: ["Sierra arco o cutter","Manguito de reparación PVC / fitting PE","Cemento PVC + imprimante","Pala y pico","Cinta de medir","Guantes y lentes de seguridad"],
    time: "2–4 horas",
    prevention: ["Instalar válvula de alivio de presión en la descarga de la bomba","Abrir y cerrar válvulas siempre lentamente","Enterrar tuberías a mínimo 30 cm","Reemplazar tuberías expuestas al sol > 10 años"],
  },

  // ─── MAQUINARIA ───────────────────────────────────────────
  {
    id: "tractor-no-arranca",
    category: "maquinaria",
    name: "Tractor no arranca",
    keywords: ["tractor","no arranca","no enciende","motor","arranque","batería","diesel","starter"],
    symptoms: ["No hay respuesta al girar la llave","Motor gira pero no prende","Clic único al intentar arrancar"],
    severity: "alta",
    causes: ["Batería descargada o sulfatada","Terminal de batería corroído","Motor de arranque defectuoso","Calentadores (glowplugs) quemados en motores diesel","Combustible agotado o con agua","Filtro de combustible obstruido"],
    immediate: ["Revisar nivel de combustible (no confundir el vacío en el indicador con una falla eléctrica)","Inspeccionar visualmente los cables de la batería"],
    steps: [
      { n:1, action:"Verificar batería", detail:"Medir voltaje en bornes con multímetro: debe ser >12.4 V en reposo. Si es <11.8 V, la batería está descargada. Cargar con cargador lento (10 A, 6 horas) o con puente desde otro vehículo." },
      { n:2, action:"Limpiar terminales de batería", detail:"Desconectar negativo primero, luego positivo. Limpiar los terminales con solución de bicarbonato (2 cucharadas/vaso de agua) y cepillo de alambre. Reconectar positivo primero, luego negativo. Aplicar grasa de bornes." },
      { n:3, action:"Verificar relay y fusibles del arranque", detail:"Localizar el relay de arranque en la caja de fusibles (ver manual). Intercambiarlo con otro relay del mismo amperaje. Si arranca, el relay estaba defectuoso. Revisar también el fusible del circuito de arranque." },
      { n:4, action:"Probar calentadores (glowplugs)", detail:"Con la llave en posición I (calentamiento), medir amperaje con pinza en el cable de cada glowplug: debe marcar 8–15 A por unidad. Si marca 0 A, el glowplug está abierto — reemplazar (torque: 15–20 Nm)." },
      { n:5, action:"Inspeccionar sistema de combustible", detail:"Purgar el sistema abriendo el tornillo de purga del filtro de combustible hasta que salga combustible limpio sin burbujas. Si el combustible huele a agua o está turbio, vaciar el tanque y rellenar." },
      { n:6, action:"Probar motor de arranque directamente", detail:"Con un cable de prueba, aplicar 12 V directamente al terminal del solenoide. Si el motor gira, el problema está en el cableado. Si no gira, el motor de arranque requiere reparación o reemplazo." },
    ],
    tools: ["Multímetro","Pinza amperimétrica","Cargador de batería","Juego de llaves","Cepillo de alambre","Cables de puente (jumper cables)"],
    time: "1–3 horas",
    prevention: ["Mantener batería cargada (no dejar el tractor parado >2 semanas sin carga)","Cambiar filtro de combustible cada 500 h","Comprobar glowplugs al inicio de temporada"],
  },
  {
    id: "motor-sobrecalentado",
    category: "maquinaria",
    name: "Motor de tractor sobrecalentado",
    keywords: ["calentamiento","sobrecalentado","temperatura","radiador","refrigeración","humo","steam","agua","coolant"],
    symptoms: ["Indicador de temperatura en zona roja","Vapor saliendo del radiador","Motor pierde potencia y se apaga solo","Olor a anticongelante quemado"],
    severity: "crítica",
    causes: ["Nivel bajo de refrigerante","Falla del ventilador o correa de ventilador","Termostato pegado en posición cerrada","Radiador obstruido externamente (polvo, paja)","Fuga de refrigerante (mangueras, juntas)","Bomba de agua defectuosa"],
    immediate: ["APAGAR EL MOTOR INMEDIATAMENTE — continuar operando quema el motor","NO abrir el radiador en caliente — esperar 30 min mínimo antes de abrir","Colocar el tractor en posición nivelada"],
    steps: [
      { n:1, action:"Inspección inicial (con motor frío)", detail:"Verificar nivel de refrigerante en el recipiente de expansión y en el radiador (con motor frío). Buscar manchas de refrigerante debajo del tractor. Revisar visualmente mangueras por grietas o ablandamiento." },
      { n:2, action:"Revisar la correa del ventilador/alternador", detail:"Con el motor apagado, empujar la correa lateralmente: debe haber 10–15 mm de deflexión. Si está rota o floja, reemplazar con la correa especificada en el manual." },
      { n:3, action:"Limpiar el radiador externamente", detail:"Usar compresor de aire o chorro de agua a baja presión, soplando desde adentro hacia afuera. Asegurarse de que las aletas no estén aplastadas. Aletas aplastadas reducen el 40% de la eficiencia de enfriamiento." },
      { n:4, action:"Probar el termostato", detail:"Retirar el termostato y sumergirlo en agua caliente (88–92°C). Debe abrirse completamente. Si no abre, reemplazar. El termostato nuevo debe ser del mismo rango de temperatura que el original." },
      { n:5, action:"Detectar fugas internas (junta de culata)", detail:"Si el aceite tiene aspecto lechoso o la tapa del radiador muestra residuos marrones, hay refrigerante en el aceite — junta de culata soplada. Esto requiere reparación en taller. NO operar el motor." },
      { n:6, action:"Llenar y purgar el sistema", detail:"Llenar lentamente con mezcla de anticongelante y agua (50/50). Con la tapa del radiador abierta, arrancar y dejar en ralentí hasta que el ventilador encienda. Cuando el nivel caiga, rellenar. Cerrar la tapa, verificar por fugas." },
    ],
    tools: ["Multímetro de temperatura / termómetro IR","Compresor de aire","Anticongelante + agua destilada","Llaves de cabeza","Recipiente para drenar","EPP (guantes térmicos)"],
    time: "2–6 horas (sin junta de culata)",
    prevention: ["Revisar nivel de refrigerante diariamente antes de operar","Cambiar anticongelante cada 2 años","Limpiar el radiador externamente cada 100 h"],
  },
  {
    id: "hidraulico-sin-presion",
    category: "maquinaria",
    name: "Sistema hidráulico sin presión (implementos no suben)",
    keywords: ["hidráulico","no sube","implemento","no levanta","presión","aceite","palanca","enganche"],
    symptoms: ["Los implementos no suben o suben muy lento","La dirección asistida está dura","Sonido de cavitación en la bomba hidráulica","Aceite hidráulico en el piso"],
    severity: "alta",
    causes: ["Nivel bajo de aceite hidráulico","Filtro hidráulico obstruido","Fuga en manguera o conector","Bomba hidráulica desgastada","Válvula de alivio descalibrada o pegada abierta"],
    immediate: ["Verificar nivel de aceite hidráulico con la varilla de nivel","Buscar charcos de aceite bajo el tractor"],
    steps: [
      { n:1, action:"Verificar nivel de aceite hidráulico", detail:"Con el tractor nivelado y los implementos bajados, revisar la varilla/visor de nivel. El aceite debe estar entre las marcas MIN y MAX. Si está bajo, rellenar con aceite hidráulico del tipo especificado en el manual (Ej: John Deere Hy-Gard, o SAE 10W-30 universal)." },
      { n:2, action:"Cambiar el filtro hidráulico", detail:"Si el filtro tiene >500 h o 1 año, proceder al cambio. Limpiar el área alrededor del filtro, retirarlo con la llave de filtros, instalar el nuevo con un poco de aceite en la junta. Rellenar el nivel. Arrancar y verificar por fugas." },
      { n:3, action:"Inspeccionar mangueras y conectores", detail:"Con el sistema bajo presión y los implementos activos, inspeccionar cada manguera y conector por fugas. Las fugas a alta presión son peligrosas — cortar el motor antes de tocar. Reemplazar mangueras con fisuras o abultamientos." },
      { n:4, action:"Probar la válvula de alivio de presión", detail:"Conectar un manómetro de alta presión (0–300 bar) al puerto de prueba del sistema. Operar el control contra el tope — la presión debe alcanzar el valor de alivio (típicamente 170–210 bar). Presión más baja indica válvula o bomba defectuosa." },
      { n:5, action:"Purgar el sistema de aire", detail:"Si el aceite fue reemplazado o hay burbujas, purgar: ciclar los implementos (subir/bajar) 10–15 veces para expulsar el aire. Verificar nivel nuevamente." },
    ],
    tools: ["Varilla de nivel","Llave de filtros","Manómetro hidráulico (0–300 bar)","Aceite hidráulico especificado","Balde y trapos","Gafas de seguridad"],
    time: "1–4 horas",
    prevention: ["Revisar nivel de aceite hidráulico diariamente","Cambiar filtro hidráulico cada 500 h","No operar cilindros al tope de carrera continuamente"],
  },
  {
    id: "neumatico-campo",
    category: "maquinaria",
    name: "Neumático ponchado en campo",
    keywords: ["neumático","llanta","ponchado","desinflado","pinchado","tire","flat","rueda"],
    symptoms: ["Tractor o equipo inclinado a un lado","Neumático visiblemente desinflado","Vibración excesiva al operar"],
    severity: "media",
    causes: ["Objeto cortante en el campo (piedra, palo puntiagudo, alambre)","Falta de presión crónica que causa falla de talón","Válvula de inflado deteriorada","Corte lateral por operación en pendiente pronunciada"],
    immediate: ["Detener el equipo inmediatamente","Si hay implementos levantados, bajarlos al piso antes de bajar","Asegurar el tractor con cuñas en las ruedas buenas"],
    steps: [
      { n:1, action:"Preparar el cambio de rueda en campo", detail:"Activar el freno de parqueo. Colocar cuñas delante y detrás de las ruedas buenas. Si hay implemento acoplado, desacoplarlo o bajarlo completamente al piso para reducir peso." },
      { n:2, action:"Colocar el gato hidráulico", detail:"Posicionar el gato en el punto de levante especificado en el manual (eje trasero o viga delantera reforzada). NUNCA usar el gato en el diferencial o en partes de chapa. Levantar hasta que el neumático quede 5 cm del suelo." },
      { n:3, action:"Retirar la rueda", detail:"Aflojar los pernos en patrón de estrella (no en círculo). Guardar los pernos en un lugar seguro. Retirar la rueda — las traseras de tractor pesan 80–120 kg; usar palanca o rodillo para manipularla." },
      { n:4, action:"Reparar o montar rueda de repuesto", detail:"Si hay rueda de repuesto disponible: montarla, apretar pernos en estrella a mano, bajar el gato, luego apretar al torque especificado (generalmente 250–300 Nm para tractores medianos). Si no hay repuesto: llamar al servicio técnico o inflar con compresor portátil si el corte es pequeño y en zona del tapón." },
      { n:5, action:"Inflado y verificación final", detail:"Verificar presión con manómetro: las ruedas traseras de tractor operan generalmente a 0.8–1.2 bar. Inspeccionar el neumático reparado por deformaciones en la carcasa antes de operar a plena velocidad." },
    ],
    tools: ["Gato hidráulico de botella (5T mínimo)","Cuñas de rueda","Llave de pernos (1/2\" o mayor)","Torquímetro","Manómetro de presión","Compresor portátil (12V)","Guantes de trabajo"],
    time: "45 min – 2 horas",
    prevention: ["Inspeccionar los campos antes de operar para retirar objetos metálicos","Revisar presión de neumáticos semanalmente","Girar los neumáticos traseros periódicamente"],
  },

  // ─── ESTRUCTURA ───────────────────────────────────────────
  {
    id: "techo-invernadero-danado",
    category: "estructura",
    name: "Techo de invernadero / casa sombra dañado por viento",
    keywords: ["techo","invernadero","casa sombra","viento","malla","plástico","polietileno","desgarro","daño","cubierta"],
    symptoms: ["Secciones de cubierta rasgadas o levantadas","Estructura metálica doblada","Goteras y humedad excesiva en el cultivo"],
    severity: "crítica",
    causes: ["Vientos superiores a la resistencia de diseño (huracanes o chubascos en RD)","Amarre de cubierta deteriorado","Perfiles galvanizados con corrosión en uniones","Cubierta plástica envejecida (>5 años, sin UV)"],
    immediate: ["Evaluar si la estructura principal (arcos) está comprometida — si hay deformación severa, no entrar","Asegurar provisionalmente la cubierta suelta con sogas para evitar más rasgados","Cubrir el cultivo con plástico de emergencia si es posible"],
    steps: [
      { n:1, action:"Evaluar la estructura metálica", detail:"Inspeccionar los arcos y pilares con una regla: si hay desviación > 2 cm/m en los arcos, la estructura requiere valoración de un ingeniero antes de reparar la cubierta. No trabajar bajo arcos doblados." },
      { n:2, action:"Retirar cubierta dañada", detail:"Aflojar los perfiles de sujeción (perfiles omega o clips) y retirar el plástico o malla dañada. Enrollar hacia un extremo. Con cubierta plástica, cortar secciones muy dañadas para facilitar el manejo." },
      { n:3, action:"Reparar uniones y perfiles", detail:"Revisar todas las uniones de los arcos: limpiar con cepillo de alambre, aplicar anticorrosivo y pintura de zinc. Reemplazar tornillos oxidados por acero inoxidable. Verificar que los pilares de anclaje estén firmes en el suelo." },
      { n:4, action:"Instalar nueva cubierta", detail:"Comenzar desde el lado contrario al viento dominante. Tensar la cubierta con ayuda de 2–3 personas. Fijar con el perfil de sujeción cada 40 cm. El plástico debe estar tenso pero sin sobretensión que cause rasgado en el viento." },
      { n:5, action:"Instalar sistema antiflap", detail:"Colocar sogas horizontales sobre la cubierta (cada 1.5–2 m) para evitar el movimiento del plástico con el viento ('flapping'). Conectar con ganchos de tensión a los pilares." },
      { n:6, action:"Verificar el drenaje del techo", detail:"Asegurarse de que los canales de agua lluvia no estén obstruidos y tengan pendiente adecuada (>1%) para evitar acumulación de agua que puede hundirse." },
    ],
    tools: ["Escalera de aluminio","Destornillador eléctrico","Cutter","Sogas de nailon (10 mm)","Perfil omega / clips de sujeción","Plástico PE con UV (200 micras)","Casco y arnés si altura >3 m"],
    time: "4–12 horas (según tamaño)",
    prevention: ["Inspeccionar y tensar la cubierta antes de cada temporada de huracanes (jun–nov)","Reemplazar cubierta plástica cada 4–5 años","Instalar cortinas rompe-vientos en los lados expuestos"],
  },
  {
    id: "drenaje-obstruido",
    category: "estructura",
    name: "Sistema de drenaje del predio obstruido",
    keywords: ["drenaje","obstruido","inundación","agua","encharcamiento","zanja","lodo","lluvia","escorrentía"],
    symptoms: ["Agua empozada en los campos después de lluvia","Zanjas y canales desbordados","Raíces del cultivo con anoxia (hojas amarillas, marchitez sin sequía)"],
    severity: "alta",
    causes: ["Sedimentación y lodo en canales","Vegetación invasora en zanjas","Tuberías de drenaje subterráneo obstruidas por raíces","Compactación del suelo que impide infiltración"],
    immediate: ["Crear alivio de emergencia con pala: abrir paso en el punto más bajo del empozamiento","Si el cultivo está inundado, drenar hacia la zanja más cercana con bomba sumergible"],
    steps: [
      { n:1, action:"Mapear el sistema de drenaje existente", detail:"Identificar todos los canales, zanjas y tubos de drenaje en el predio. Determinar la dirección del flujo y el punto de descarga. Localizar la obstrucción principal (donde el nivel sube)." },
      { n:2, action:"Limpiar canales superficiales", detail:"Con azadón y pala, retirar el sedimento y vegetación de los canales abiertos. El canal debe tener forma trapezoidal con taludes estables. Limpiar al menos 50 cm de profundidad desde el nivel del suelo." },
      { n:3, action:"Desobstruir tuberías de drenaje", detail:"Introducir una serpiente de drenaje (o chorro de agua a presión) en las tuberías obstruidas. Si hay raíces, usar herramienta de corte de raíces. Si la tubería está colapsada, excavarla y reemplazar el tramo." },
      { n:4, action:"Verificar el punto de descarga", detail:"Asegurarse de que la descarga final (canal de guardia, quebrada, acequia) esté libre y tenga capacidad. Un punto de descarga obstruido hace inútil limpiar el sistema interno." },
      { n:5, action:"Subsolado para compactación", detail:"Si el suelo está muy compactado, usar subsolador en el tractor (a 50–70 cm de profundidad) para crear canales de infiltración. Realizar en condiciones de suelo semiseco, no empapado." },
    ],
    tools: ["Pala y azadón","Serpiente de drenaje","Bomba sumergible de emergencia","Subsolador (si disponible en tractor)","GPS/mapa del predio"],
    time: "1–3 días",
    prevention: ["Limpiar canales dos veces al año (antes y después de temporada de lluvias)","Sembrar vegetación de ribera (vetiver) en los taludes de zanjas","Evitar compactación con maquinaria pesada en suelos húmedos"],
  },
  {
    id: "cerca-caida",
    category: "estructura",
    name: "Cercado o valla perimetral caída o dañada",
    keywords: ["cerca","valla","cerco","poste","alambre","caída","dañada","ganado","animales","corral"],
    symptoms: ["Postes caídos o inclinados","Alambre suelto o roto","Animales o intrusos entrando o saliendo del predio"],
    severity: "media",
    causes: ["Corrosión de postes metálicos en base","Madera de postes sin tratar atacada por termitas","Tensión excesiva acumulada en el alambre","Impacto por tormenta o animales"],
    immediate: ["Contener los animales alejándolos del área de brecha","Bloquear temporalmente la brecha con ramas gruesas o tablas"],
    steps: [
      { n:1, action:"Evaluar el tramo completo afectado", detail:"Caminar el perímetro dañado. Identificar postes podridos, quebrados o inclinados >15°. Medir cuántos metros requieren reemplazo completo versus re-tensado." },
      { n:2, action:"Reemplazar postes deficientes", detail:"Extraer el poste viejo con gato o palanca. El hoyo nuevo debe tener >60 cm de profundidad (zona de heladas: 90 cm). Usar postes de madera tratada (cactus/teca/pino tratado) o postes T de acero galvanizado. El 1/3 del poste debe estar enterrado." },
      { n:3, action:"Re-tensar o reemplazar el alambre", detail:"Para alambre liso/de púas: usar tensor de araña o grapas tensoras. Tensar desde el poste de esquina hacia afuera. El alambre no debe flaquear más de 5 cm al presionar a la mitad. Si el alambre está oxidado >50%, reemplazar." },
      { n:4, action:"Reforzar postes de esquina", detail:"Los postes de esquina reciben toda la tensión longitudinal. Instalar postes diagonales de refuerzo (muertos) o tensores de cable desde el poste hasta un anclaje en el suelo." },
    ],
    tools: ["Gato de palanca / cavador de postes","Mazo","Alambre de púas o malla","Grapas y tensores","Guantes de trabajo gruesos","Poste T o de madera tratada"],
    time: "4–8 horas por 100 m",
    prevention: ["Inspeccionar cercas al inicio y final de cada año","Tratar la base de los postes de madera con aceite quemado o brea","Usar postes galvanizados en zonas de alta humedad"],
  },

  // ─── ELÉCTRICO ────────────────────────────────────────────
  {
    id: "motor-electrico-bomba",
    category: "electrico",
    name: "Motor eléctrico de bomba de riego falla",
    keywords: ["motor","eléctrico","no arranca","arranca","se calienta","falla","quemado","sobrecarga","bomba","eléctrica"],
    symptoms: ["Motor arranca pero se apaga tras pocos minutos","Olor a quemado o humo del motor","Protección térmica activa constantemente","Motor vibra excesivamente"],
    severity: "alta",
    causes: ["Tensión de alimentación baja (<95% del nominal)","Desequilibrio de fases en alimentación trifásica","Sobretemperatura por falta de ventilación","Rodamientos desgastados que aumentan la carga","Bomba acoplada con sobrecarga (impulsor atascado)"],
    immediate: ["Desconectar el motor del tablero","No intentar arrancar repetidamente — cada intento sin resolver la causa quema más el bobinado","Medir el voltaje en el tablero antes de diagnosticar el motor"],
    steps: [
      { n:1, action:"Verificar calidad de la alimentación eléctrica", detail:"Con multímetro en las 3 fases: medir L1-L2, L2-L3, L1-L3. La diferencia entre cualquier par no debe superar el 2% del voltaje nominal. Si hay desequilibrio >3%, contactar a la distribuidora eléctrica." },
      { n:2, action:"Probar la protección térmica (termistor/bimetálico)", detail:"Medir con óhmetro entre los terminales del protector térmico. Debe haber continuidad (cerca de 0 Ω) en frío. Si es circuito abierto, el protector dispara pero puede estar defectuoso — consultar placa del motor." },
      { n:3, action:"Revisar rodamientos", detail:"Girar el eje a mano: debe girar suave y sin vibración. Ruido metálico ('cric cric') indica rodamientos dañados. Reemplazar rodamientos (desmontaje requiere extractor y prensa)." },
      { n:4, action:"Medir resistencia del bobinado", detail:"Con motor desconectado: medir resistencia entre cada par de terminales (U-V, V-W, U-W). Diferencias >2% entre pares indican bobinado dañado. Medir también entre terminales y tierra: debe ser >500 kΩ (motor seco) o >1 MΩ (motor en buen estado)." },
      { n:5, action:"Verificar la bomba (carga mecánica)", detail:"Desacoplar el motor de la bomba. Arrancar solo el motor: si funciona sin protección dispararse, el problema está en la bomba (impulsor trabado, desgastado o con objeto extraño). Desmontar la bomba e inspeccionar." },
      { n:6, action:"Calibrar la protección de sobrecarga", detail:"El relé térmico debe estar ajustado al amperaje nominal de la placa ±5%. Si está sobredimensionado, no protege el motor. Recalibrar según placa y medir el amperaje real de operación." },
    ],
    tools: ["Multímetro digital","Pinza amperimétrica","Megóhmetro (500V)","Extractor de rodamientos","Guantes dieléctricos","EPP completo"],
    time: "2–6 horas",
    prevention: ["Instalar protector de fases y voltaje en todos los motores trifásicos","Limpiar las rejillas de ventilación mensualmente","Medir amperaje de operación trimestralmente y comparar con la placa"],
  },
  {
    id: "generador-no-arranca",
    category: "electrico",
    name: "Generador de emergencia no arranca",
    keywords: ["generador","planta","no arranca","emergencia","luz","corte","diesel","gasolina","generador electrico"],
    symptoms: ["El generador no arranca cuando hay corte de luz","Motor del generador gira pero no prende","El generador arranca pero no genera voltaje"],
    severity: "alta",
    causes: ["Combustible agotado o envejecido (gasolina > 3 meses se degrada)","Bujías o filtro de aire sucios (gasolina) / glowplugs (diesel)","Aceite de motor bajo, activando la parada de seguridad","Exceso de carga conectada al arrancar","AVR (regulador de voltaje automático) defectuoso"],
    immediate: ["Verificar que la llave de combustible esté abierta","Revisar nivel de aceite de motor — muchos generadores no arrancan con nivel bajo"],
    steps: [
      { n:1, action:"Verificar combustible y aceite", detail:"Combustible: debe haber combustible fresco. Si el generador lleva >3 meses parado sin uso, drenar el carburador o tanque y rellenar con combustible fresco. Aceite: verificar nivel con la varilla; debe estar entre MIN y MAX." },
      { n:2, action:"Limpiar o reemplazar bujías (gasolina)", detail:"Retirar la bujía con llave de bujías. Inspeccionarla: debe ser de color marrón-grisáceo. Electrodo quemado, cubierto de negro o mojado de combustible → reemplazar. Ajuste de brecha: 0.7–0.8 mm." },
      { n:3, action:"Limpiar el carburador (gasolina)", detail:"Si el motor arranca solo con el choke cerrado o tiene dificultades, el carburador tiene barniz. Usar limpiador de carburador en spray. Si persiste, desmontar el carburador, limpiar todos los orificios del flotador y el chorro principal con alambre fino y aire comprimido." },
      { n:4, action:"Probar el AVR si no genera voltaje", detail:"Si el motor corre pero no hay voltaje de salida: medir voltaje en los terminales de salida del generador. Si es 0 V, revisar el AVR (regulador). El AVR puede alimentarse de los condensadores de excitación — medir si tienen carga." },
      { n:5, action:"Reducir carga al arranque", detail:"Desconectar todas las cargas antes de arrancar el generador. Conectarlas gradualmente después de que el motor esté en régimen (>1 min). Los motores de bomba son cargas de arranque alto — deben ser los últimos en conectar." },
    ],
    tools: ["Llave de bujías","Multímetro","Limpiador de carburador","Bujías de repuesto","Combustible fresco","Aceite de motor del tipo especificado"],
    time: "1–4 horas",
    prevention: ["Arrancar el generador en vacío 15 min mensualmente","Usar combustible fresco; agregar estabilizador si va a estar parado >1 mes","Cambiar aceite y bujías/filtros cada 100 h de operación"],
  },
  {
    id: "corto-circuito-panel",
    category: "electrico",
    name: "Corto circuito o sobrecarga en tablero eléctrico",
    keywords: ["corto","cortocircuito","interruptor","tablero","panel","eléctrico","fusible","disyuntor","apagón"],
    symptoms: ["Disyuntor se dispara repetidamente","Olor a quemado en el tablero","Chispas o arcos eléctricos","Luces o equipos parpadean o se apagan"],
    severity: "crítica",
    causes: ["Cable pelado en contacto con otro cable o tierra","Carga total supera la capacidad del circuito","Humedad dentro del tablero","Conexión floja que genera arco eléctrico","Equipo defectuoso conectado al circuito"],
    immediate: ["Desconectar el interruptor general INMEDIATAMENTE","Si hay humo o fuego, usar extintor de CO₂ (NUNCA agua)","No volver a energizar hasta identificar la causa"],
    steps: [
      { n:1, action:"Aislar el circuito afectado", detail:"Con el interruptor general abierto, identificar qué disyuntor disparó. Dejar ese circuito abierto y cerrar el general para evaluar el resto del sistema." },
      { n:2, action:"Inspeccionar el tablero", detail:"Con el general abierto, revisar el interior del tablero con linterna: buscar cables quemados, conexiones negras o con depósitos de carbón, humedad o agua. Verificar que todas las conexiones estén firmes." },
      { n:3, action:"Identificar el equipo causante", detail:"Desconectar todos los equipos del circuito afectado. Resetear el disyuntor y conectar los equipos de uno en uno. El que dispara el interruptor al conectarlo es el causante. Retirarlo de servicio." },
      { n:4, action:"Verificar el cableado del circuito", detail:"Con el circuito desconectado y sin equipos, usar el multímetro en modo continuidad entre el cable vivo y el neutro: no debe haber continuidad (resistencia). Si la hay, hay un corto en el cableado — buscar punto de daño." },
      { n:5, action:"Llamar a un electricista si el problema persiste", detail:"Si hay cables quemados, arco eléctrico dentro del tablero, o el disyuntor no retiene el reset, el trabajo debe realizarlo un electricista certificado. El trabajo en tableros es peligroso sin equipo de protección eléctrica." },
    ],
    tools: ["Multímetro","Linterna","Guantes dieléctricos (clase 0 mínimo)","Destornilladores aislados","Extintor de CO₂"],
    time: "1–8 horas",
    prevention: ["Instalar disyuntores del amperaje correcto (no 'puentear' fusibles)","Usar cable del calibre correcto para cada carga","Colocar los tableros en zonas ventiladas y protegidas de la lluvia","Revisión eléctrica anual por profesional certificado"],
  },

  // ─── ALMACENAMIENTO ───────────────────────────────────────
  {
    id: "temperatura-alta-silo",
    category: "almacenamiento",
    name: "Temperatura elevada en silo o almacén de granos",
    keywords: ["silo","temperatura","caliente","grano","arroz","maíz","frijol","almacenamiento","fermentación","humo"],
    symptoms: ["Temperatura del grano > 30°C (arroz/maíz) o > 25°C (semillas)","Olor a fermentación o a moho","Condensación en la superficie del grano","Presencia de insectos en aumento"],
    severity: "crítica",
    causes: ["Grano almacenado con humedad superior al límite (>14% arroz, >13% maíz)","Ventilación insuficiente o bloqueada","Punto caliente por infestación de insectos","Grano no enfriado antes de ingresar al silo"],
    immediate: ["Activar los ventiladores de aireación de inmediato","Medir la temperatura en varios puntos con termómetro de sonda larga","Si la temperatura supera 40°C, extraer el grano inmediatamente"],
    steps: [
      { n:1, action:"Medir temperatura y humedad del grano", detail:"Introducir el termómetro de sonda a >1 m de profundidad en al menos 4 puntos. Si hay variación >5°C entre puntos, hay puntos calientes. Medir humedad con higrómetro de granos: si excede el límite, es la causa principal." },
      { n:2, action:"Activar ventilación de emergencia", detail:"Encender todos los ventiladores de aireación forzada disponibles. En silos sin ventilación, abrir escotillas superiores e inferiores para generar convección. Ventilar preferiblemente de noche cuando el aire exterior es más fresco y seco." },
      { n:3, action:"Voltear / transferir el grano", detail:"Si la temperatura no baja en 24 h, transferir el grano a otro silo o secarlo. Durante la transferencia, el grano se expone al aire y libera humedad y calor. Velocidad de transferencia: cuanto más rápido, mejor." },
      { n:4, action:"Tratar con insecticida si hay infestación", detail:"Si hay insectos, aplicar insecticida autorizado para granos almacenados (ej: Deltametrina 0.5%) según la dosis de la etiqueta. Sellar el silo durante 72 h después de la aplicación." },
      { n:5, action:"Secar el grano si la humedad es alta", detail:"Usando secadora de flujo continuo o tendido al sol (grano < 10 cm de espesor). Objetivo: humedad < 14% para arroz, < 13% para maíz, < 12% para semillas. Medir cada hora durante el secado." },
      { n:6, action:"Revisar el aislamiento del silo", detail:"Una vez vaciado el silo, inspeccionar el techo y las paredes por goteras o condensación. Aplicar sellante y pintura reflectante en el exterior para reducir la ganancia de calor solar." },
    ],
    tools: ["Termómetro de sonda larga (>1 m)","Higrómetro de granos","Ventiladores portátiles","Secadora de granos (o área para tendido)","Insecticida para granos almacenados","EPP (mascarilla)"],
    time: "24–72 horas",
    prevention: ["Solo almacenar granos con la humedad correcta","Medir temperatura y humedad 2 veces por semana durante los primeros 30 días","Limpiar el silo completamente antes de cada cosecha"],
  },
  {
    id: "plagas-almacen",
    category: "almacenamiento",
    name: "Infestación de plagas en almacén (gorgojos, ratas, hongos)",
    keywords: ["plaga","gorgojo","rata","ratón","hongo","moho","grano","almacén","silo","insecto","infestación"],
    symptoms: ["Grano con huecos o polvo interno (gorgojos)","Excrementos de roedores","Mal olor y manchas de moho en sacos o a granel","Pérdida de peso notable en el grano"],
    severity: "alta",
    causes: ["Humedad de almacenamiento demasiado alta","Grietas en pisos y paredes que dan entrada a roedores","Granos con residuos de cosecha que atraen insectos","Ausencia de programa de control sanitario"],
    immediate: ["Aislar los sacos afectados del resto del lote","Bloquear accesos de roedores con malla metálica fina de emergencia"],
    steps: [
      { n:1, action:"Evaluar el nivel de infestación", detail:"Tomar muestras de 500 g de grano en 5 puntos distintos. Contar insectos/grano. Clasificar: <1 insecto/kg = leve, 1–5 = moderado, >5 = grave. Si hay roedores, buscar señales de entrada (heces, caminos en el polvo)." },
      { n:2, action:"Fumigación con fosfuro de aluminio (grave/moderado)", detail:"Solo para almacenes herméticos con personal certificado. Dosis: 3 tabletas/m³ para temperatura >25°C. Sellar el almacén 72–120 h. Ventilar >6 h antes de ingresar. PELIGRO: produce gas fosfina altamente tóxico — exige procedimiento y licencia." },
      { n:3, action:"Control de roedores", detail:"Instalar cebos raticidas en puntos estratégicos (esquinas, bordes) dentro de estaciones protegidas (no expuestas al grano). Sellar grietas y huecos con mortero de cemento + vidrio molido. Colocar malla metálica <6 mm en ventanas y desagües." },
      { n:4, action:"Control de moho", detail:"Retirar el grano afectado por moho visible. El grano con moho extenso no tiene recuperación — descartar para consumo. Si el moho es superficial (sacos), secar el almacén y mejorar la ventilación. Lavar paredes con solución de hipoclorito (1%) y dejar secar." },
      { n:5, action:"Limpieza profunda del almacén", detail:"Vaciar completamente el almacén. Barrer y aspirar todos los residuos. Lavar el piso y paredes con hipoclorito. Dejar secar >48 h. Aplicar insecticida residual en pisos y paredes antes de volver a usar." },
    ],
    tools: ["Balanza","Lupa de mano","Estaciones raticidas","Raticida anticoagulante","Hipoclorito de sodio","Mascarilla FFP3","EPP completo"],
    time: "2–5 días",
    prevention: ["Limpiar el almacén entre cada cosecha","Mantener humedad relativa del almacén < 70%","Establecer monitoreo mensual con trampas de captura","No almacenar grano húmedo ni con impurezas"],
  },
  {
    id: "camara-fria-falla",
    category: "almacenamiento",
    name: "Falla de temperatura en cámara fría",
    keywords: ["cámara fría","refrigeración","temperatura","compresor","frío","evaporador","condenser","frigorífico"],
    symptoms: ["La temperatura sube por encima del set point","Compresor no para (trabaja continuamente)","Formación excesiva de hielo en el evaporador","Humedad muy alta dentro de la cámara"],
    severity: "crítica",
    causes: ["Bajo nivel de refrigerante (fuga)","Evaporador bloqueado por escarcha excesiva","Deshielo automático defectuoso","Puerta con mal sellado de junta","Condensador sucio (ventilador o aletas)"],
    immediate: ["Transferir el producto sensible a otra cámara o refrigeración provisional","Registrar la temperatura actual y el tiempo que lleva fuera de rango","Verificar si el compresor está funcionando (ruido del compresor)"],
    steps: [
      { n:1, action:"Deshielo manual de emergencia del evaporador", detail:"Apagar el compresor. Colocar ventiladores dentro de la cámara para acelerar el deshielo. Con el evaporador libre de hielo, encender el sistema. Si la temperatura vuelve a la normalidad, el problema es el deshielo automático defectuoso — revisar la resistencia y el termostato de deshielo." },
      { n:2, action:"Verificar el condensador", detail:"Inspeccionar el condensador exterior: las aletas deben estar limpias. Limpiar con chorro de agua o aire comprimido desde adentro hacia afuera. Verificar que el ventilador del condensador gire." },
      { n:3, action:"Inspeccionar la junta de la puerta", detail:"Con la cámara fría, pasar una tira de papel por el borde de la puerta al cerrarla: si sale fácilmente, la junta no sella. Reemplazar la junta con la original del fabricante (hay magnética y de compresión)." },
      { n:4, action:"Verificar nivel de refrigerante (solo técnico certificado)", detail:"La detección de fugas y la recarga de refrigerante requiere técnico en refrigeración con equipo de detección y certificación. No intentar recargar sin equipo — el refrigerante es peligroso y su manejo está regulado." },
      { n:5, action:"Revisar el termostato / controlador electrónico", detail:"Verificar que el set point esté correcto. Probar el sensor de temperatura: sumergirlo en agua con hielo (0°C) y verificar que el controlador muestre 0°C ±1°C. Si hay error, recalibrar o reemplazar el sensor." },
    ],
    tools: ["Termómetro digital de sonda","Multímetro","Ventiladores portátiles","Compresor de aire","Detector de fugas de refrigerante (solo técnico)"],
    time: "2–8 horas",
    prevention: ["Realizar deshielo preventivo mensual si no es automático","Limpiar el condensador cada 3 meses","Revisar las juntas de puerta semestralmente"],
  },
]

export function searchFaults(query: string, category: FaultCategory | null): FaultEntry[] {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter((t) => t.length > 2)
  const scored = FAULT_DATABASE
    .filter((f) => !category || f.category === category)
    .map((f) => {
      if (tokens.length === 0) return { fault: f, score: 1 }
      const score = tokens.reduce((s, t) => {
        const inName = f.name.toLowerCase().includes(t) ? 3 : 0
        const inKw = f.keywords.some((k) => k.includes(t)) ? 2 : 0
        const inSym = f.symptoms.some((sym) => sym.toLowerCase().includes(t)) ? 1 : 0
        const inCause = f.causes.some((c) => c.toLowerCase().includes(t)) ? 1 : 0
        return s + inName + inKw + inSym + inCause
      }, 0)
      return { fault: f, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  return scored.map((x) => x.fault)
}
