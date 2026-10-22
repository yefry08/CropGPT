# La IA prohibida de Warhammer y el agente que borró una base de datos en 9 segundos

**Reel 9:16 · 0:59 · español** · serie de seguridad de la IA · estilo collage de papel · voz clonada (Voicebox) y animación generadas con IA

**Texto para publicar:**
En Warhammer 40.000 la IA está prohibida porque las máquinas se rebelaron. En la vida real, un agente de programación borró la base de datos de producción de PocketOS en 9 segundos, y no fue una rebelión: fue un permiso excesivo, ninguna confirmación y copias en el mismo sitio. ¿Tú le darías a una IA las llaves de producción? #InteligenciaArtificial #Warhammer40k #AgentesIA #SeguridadIA #DevOps

Aviso: el agente usaba un modelo Claude de Anthropic, la empresa que también hace la herramienta con la que se animó este video (en el reel va como texto en pantalla, no narrado). Voz sintética clonada de mi propia voz. Ilustraciones genéricas, sin personas reales.

**Qué verificamos respecto al reel original:**

| El reel original decía | Lo que dicen las fuentes |
|---|---|
| Una IA borró la base de datos de una empresa | El agente (Cursor con Claude Opus 4.6) hacía una tarea rutinaria en staging, chocó con un error de credenciales y usó un token de API con demasiados permisos que encontró en un archivo no relacionado. Borró el volumen de Railway con la base de datos de producción en unos 9 segundos. |
| Se perdieron todas las copias | Las copias de seguridad estaban en el mismo volumen y desaparecieron con él. La copia más reciente en otro lugar tenía 3 meses. |
| Pérdidas de millones de euros | Sin fuente verificable; no lo usamos. |
| En Warhammer la IA está prohibida | Confirmado en el lore: tras la rebelión de los Hombres de Hierro (Men of Iron), la "inteligencia abominable" es herejía en el Imperio. |

**Fuentes:**
- ACS Information Age, «Gone in 9 seconds»: https://ia.acs.org.au/article/2026/gone-in-9-seconds--ai-agent-deletes-company-database.html
- Tom's Hardware: https://www.tomshardware.com/tech-industry/artificial-intelligence/claude-powered-ai-coding-agent-deletes-entire-company-database-in-9-seconds-backups-zapped-after-cursor-tool-powered-by-anthropics-claude-goes-rogue
- Postmortem en dev.to: https://dev.to/axrisi/railway-database-deleted-by-an-ai-agent-the-pocketos-postmortem-2p7p
- Let's Data Science: https://letsdatascience.com/news/pocketos-founder-reports-ai-agent-deleted-production-databas-8f0213e2
- Warhammer 40k Wiki, Men of Iron: https://warhammer40k.fandom.com/wiki/Men_of_Iron
- Bell of Lost Souls, «Abominable Intelligences»: https://www.belloflostsouls.net/2020/05/warhammer-40k-loremasters-abominable-intelligences.html

**Contenido sintético:** sí. Marca la casilla de contenido generado con IA al publicar.
