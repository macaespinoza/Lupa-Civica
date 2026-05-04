# Lupa Cívica — Fiscalización Ciudadana CL

**Plataforma de transparencia legislativa para auditar el Congreso Nacional de Chile.**

Lupa Cívica pone a disposición de la ciudadanía datos abiertos sobre asistencia, probidad (Ley 20.880 y Ley 20.730) y votaciones de los parlamentarios chilenos. Incluye un directorio con puntajes de eficiencia, un quiz de afinidad ideológica ("Match Legislativo") y herramientas de accesibilidad.

> **Datos que Auditan** — Porque fiscalizar es un derecho, no un privilegio.

---

## Características

- **Directorio de parlamentarios** — Ficha por cada legislador con foto, partido, región, email y puntaje de eficiencia (0–100).
- **Ranking de desempeño** — Top 3 y bottom 3 según el algoritmo de eficiencia.
- **Match Legislativo** — Quiz interactivo para encontrar afinidad ideológica con parlamentarios (fase prototipo).
- **Metodología transparente** — Explicación detallada del algoritmo de puntuación.
- **Accesibilidad** — Modo de alto contraste y aumento de fuente, persistido en el navegador.
- **Autenticación** — Registro e inicio de sesión con email/contraseña o Google.
- **Scraping automatizado** — Pipeline que recolecta datos de BCN.cl y Senado.cl (~205 legisladores).
- **Datos abiertos** — Toda la información se sirve desde Firestore y está disponible públicamente.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) + TypeScript |
| UI | React 19 + [Tailwind CSS v4](https://tailwindcss.com/) |
| Animaciones | [Motion](https://motion.dev/) |
| Base de datos | [Google Cloud Firestore](https://cloud.google.com/firestore) |
| Autenticación | [Firebase Auth](https://firebase.google.com/products/auth) |
| Scraping | [Cheerio](https://cheerio.js.org/) + [Axios](https://axios-http.com/) |
| Despliegue | Docker → [Cloud Run](https://cloud.google.com/run) + [Firebase Hosting](https://firebase.google.com/products/hosting) |
| Íconos | [Lucide](https://lucide.dev/) |

---

## Inicio Rápido

### Requisitos previos

- Node.js 20+
- Cuenta de Google Cloud con Firestore habilitado (proyecto `lupa-bdd`)
- Archivo de credenciales de servicio de GCP (para scripts de scraping)

### Instalación

```bash
git clone <repo-url>
cd Prototipo_v1
npm install
```

### Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

Variables requeridas:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key de Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto GCP |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID de Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de Firebase Auth |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al JSON de cuenta de servicio (scripts) |

### Desarrollo

```bash
npm run dev        # Servidor de desarrollo en http://localhost:3000
npm run build      # Build y exportación estática a /out
npm run lint       # ESLint
```

### Pipeline de datos

```bash
npm run scrape           # Scraping completo de BCN + Senado.cl (205 legisladores)
npm run scrape:test      # Scraping de prueba (solo 5 legisladores)
npm run upload:firestore # Subir scraped_data.json a Firestore
```

### Utilidades de datos

```bash
npx tsx scripts/check-data.ts         # Verificar cantidad de legisladores en Firestore
npx tsx scripts/check-firestore.ts    # Probar conexión a Firestore
npx tsx scripts/clean-and-verify.ts   # Validar y deduplicar datos
npx tsx scripts/seed-data.ts          # Sembrar datos de prueba
```

---

## Estructura del Proyecto

```
Prototipo_v1/
├── app/                    # Páginas (Next.js App Router)
│   ├── layout.tsx          # Layout raíz, metadata, providers
│   ├── page.tsx            # Landing page
│   ├── legislators/        # Directorio y ficha de parlamentarios
│   ├── match/              # Quiz "Match Legislativo"
│   └── metodologia/        # Explicación del algoritmo
├── components/             # Componentes reutilizables
├── hooks/                  # Custom hooks (auth, legislators, mobile)
├── lib/                    # Lógica de negocio (evaluador, firestore, tipos)
├── scripts/                # Pipeline de datos (scraping, upload, validación)
├── firestore.rules         # Reglas de seguridad de Firestore
├── firestore.indexes.json  # Índices compuestos de Firestore
├── next.config.ts          # Configuración de Next.js
└── Dockerfile              # Contenedor para Cloud Run
```

Para una guía detallada de cada archivo y las convenciones del código, consulta [`AGENTS.md`](./AGENTS.md).

---

## Estado del Proyecto

**Prototipo v1 — En desarrollo activo.**

| Funcionalidad | Estado |
|---|---|
| Landing page | Completado |
| Directorio de parlamentarios | Completado |
| Ficha individual de parlamentario | Placeholder (3 IDs) |
| Match Legislativo | Datos simulados |
| Scoring de eficiencia | Algoritmo listo, datos reales pendientes |
| Scraping de datos | Completado (bio, partido, región, email) |
| Autenticación | Completado |
| Panel de administración | Pendiente |
| Páginas legales (privacidad, datos abiertos) | Pendientes |
| Tests automatizados | Pendientes |

---

## Contribuir

Las contribuciones son bienvenidas. Áreas donde se necesita ayuda:

1. **Ficha de parlamentario** — Página de detalle con datos reales.
2. **Scraping de votaciones/asistencia** — Datos duros para el puntaje de eficiencia.
3. **Match Legislativo** — Algoritmo de afinidad ideológica con votaciones reales.
4. **Panel de administración** — Gestión de datos, analytics, triggers de sincronización.
5. **Tests** — Unitarios para `evaluator.ts` y utilidades de transformación de datos.
6. **Páginas faltantes** — `/admin`, `/projects`, `/datos-abiertos`, `/privacidad`.

Antes de contribuir, lee [`AGENTS.md`](./AGENTS.md) para entender las convenciones y arquitectura del proyecto.

---

## Licencia

Por definir.

---

## Contacto

Proyecto de fiscalización ciudadana desarrollado para el ecosistema cívico chileno. Para consultas o colaboración, abre un issue en el repositorio.
