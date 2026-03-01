# HackUDC 2026 🚀

Plataforma oficial de HackUDC 2026 — el hackathon de código abierto de Galicia organizado por GPUL.

## Sobre HackUDC

HackUDC es un hackathon open source que reúne a más de 400 desarrolladores, estudiantes y entusiastas de la tecnología durante un fin de semana de innovación, aprendizaje y comunidad. Organizado por GPUL (Grupo de Programadores e Usuarios de Linux) en la Universidad de A Coruña, el evento celebra la cultura del software libre y fomenta el talento tecnológico en Galicia.

**Detalles del evento:**

- 📅 Febrero 2026
- 🏛️ Universidad de A Coruña
- 👥 400+ participantes esperados
- 💻 Proyectos y retos open source

---

## Stack tecnológico

| Capa                 | Tecnología                                                        |
| -------------------- | ----------------------------------------------------------------- |
| Framework            | [Astro](https://astro.build/) (modo SSR)                          |
| Estilos              | [Tailwind CSS v4](https://tailwindcss.com/)                       |
| Base de datos y auth | [Supabase](https://supabase.com/) (PostgreSQL + Auth)             |
| Tipografía           | [Roboto](https://fonts.google.com/specimen/Roboto) via Fontsource |
| Iconos               | [Font Awesome 6](https://fontawesome.com/)                        |
| Markdown             | [marked](https://marked.js.org/)                                  |
| Componentes React    | [React 19](https://react.dev/)                                    |
| Despliegue           | [Vercel](https://vercel.com/)                                     |
| Gestor de paquetes   | pnpm                                                              |

---

## Funcionalidades de la plataforma

### Autenticación

- Registro con email y contraseña (con confirmación de contraseña)
- Inicio de sesión con GitHub (OAuth, flujo implícito)
- Perfil ampliado: nombre, institución, carrera, año de estudio, GitHub, LinkedIn, Twitter, Instagram, web personal

### Roles de usuario

| Rol       | Permisos                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| `Hacker`  | Ver y participar en proyectos, tasks, chat, challenges, fotos                                               |
| `Mentor`  | Todo lo anterior + panel de mentores, gestión de tasks con chat integrado                                   |
| `Sponsor` | Todo lo anterior + crear, editar y eliminar sus propios challenges                                          |
| `Admin`   | Acceso completo: gestión de usuarios, roles, valoraciones de proyectos, editar/eliminar cualquier challenge |

### Proyectos

- Cada participante puede pertenecer a un proyecto
- Vista de proyecto propia: info + chat en tiempo real + gestión de tasks
- Listado de todos los proyectos con estado (`in_progress`, `submitted`)
- Asignación de challenge a un proyecto
- Valoración de proyectos por administradores (puntuación 0–10)

### Challenges (Retos de sponsors)

- Listado público de todos los challenges
- Detalle con descripción en Markdown, recompensa y proyectos asignados
- Creación y edición por sponsor dueño o admin
- Eliminación por sponsor dueño o admin

### Tasks

- Sistema de tareas por proyecto con subtareas
- Estados: `pending`, `in_progress`, `done`, `cancel`
- Asignación de subtareas a miembros
- Chat por tarea (visible solo en el panel de mentores)
- Panel de mentores para gestión de tasks entre proyectos

### Chat en tiempo real

- Chat general e integrado en proyectos, tasks y challenges
- Reacciones, respuestas (reply), edición y eliminación de mensajes
- Colores de nombre según rol del usuario

### Otros

- 📸 Galería de fotos del evento (subida por participantes)
- 🆘 Sistema de solicitud de ayuda a mentores (`needhelp`)
- 📅 Página de agenda del evento
- 🌐 Versión en español e inglés de páginas informativas (conducta, privacidad, términos, información, reglas)
- 👤 Perfiles públicos de usuarios
- 🏢 Página de patrocinadores
- 🔒 Panel de administración con gestión de usuarios y cambio de roles

---

## Estructura del proyecto

```
src/
├── assets/              # Imágenes y recursos estáticos
│   ├── collaborators/
│   ├── logos/
│   └── sponsors/
├── components/          # Componentes Astro reutilizables
│   ├── Chat.astro
│   ├── TasksPanel.astro
│   ├── Schedule.astro
│   ├── ShowSponsors.astro
│   └── ...
├── data/
│   └── schedule.ts      # Datos del horario del evento
├── layouts/             # Layouts base
│   ├── Layout.astro
│   ├── InfoLayout.astro
│   └── MarkdownLayout.astro
├── lib/
│   └── supabase.ts      # Clientes Supabase (anon + admin)
├── pages/
│   ├── index.astro      # Landing page
│   ├── dashboard.astro  # Panel del participante
│   ├── projects.astro   # Proyectos
│   ├── challenges.astro # Listado de challenges
│   ├── challenge.astro  # Detalle de challenge
│   ├── create-challenge.astro
│   ├── edit-challenge.astro
│   ├── tasks.astro      # Panel de mentores
│   ├── mentors.astro    # Listado de mentores
│   ├── photos.astro     # Galería de fotos
│   ├── needhelp.astro   # Solicitud de ayuda
│   ├── profile.astro    # Perfil propio
│   ├── sponsors.astro   # Patrocinadores
│   ├── schedule.astro   # Agenda
│   ├── signin.astro     # Inicio de sesión
│   ├── register.astro   # Registro
│   ├── admin.astro      # Panel de administración
│   ├── admin/           # API de administración
│   ├── api/auth/        # Endpoints de autenticación
│   ├── api/challenges/  # Endpoints de challenges
│   ├── user/            # Perfiles públicos de usuarios
│   └── es/              # Páginas en español
└── styles/
    └── global.css
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
PUBLIC_SITE_URL=http://localhost:4321
```

> Para producción, `PUBLIC_SITE_URL` debe ser la URL pública del sitio (p. ej. `https://hackudc.gpul.org`).

---

## Base de datos

El esquema completo está en [`supabase.sql`](supabase.sql). Las tablas principales son:

| Tabla                 | Descripción                          |
| --------------------- | ------------------------------------ |
| `profiles`            | Datos de usuario extendidos          |
| `projects`            | Proyectos del hackathon              |
| `project_member`      | Relación participante ↔ proyecto     |
| `tasks` / `subtasks`  | Sistema de tareas con subtareas      |
| `challenges`          | Retos de sponsors                    |
| `sponsors`            | Información de patrocinadores        |
| `messages`            | Mensajes de chat por canal           |
| `photos`              | Fotos del evento                     |
| `assistance_requests` | Solicitudes de ayuda a mentores      |
| `project_ratings`     | Valoraciones de proyectos por admins |
| `upvotes`             | Sistema de votos en entidades        |

### Configurar GitHub OAuth en Supabase

1. Ve a **Authentication → Providers → GitHub** en el dashboard de Supabase.
2. Activa el proveedor e introduce el Client ID y Client Secret de tu [GitHub OAuth App](https://github.com/settings/developers).
3. Añade `<PUBLIC_SITE_URL>/api/auth/callback` a los **Redirect URLs** permitidos.

---

## Instalación y desarrollo

### Prerequisitos

- Node.js >= 22.0.0
- pnpm

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/gpul-org/hackudc-2026.git
cd hackudc-2026

# Instalar dependencias
pnpm install

# Copiar y rellenar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
pnpm dev
```

La web estará disponible en `http://localhost:4321`.

### Scripts disponibles

```bash
pnpm dev        # Servidor de desarrollo
pnpm build      # Build de producción
pnpm preview    # Vista previa del build
```

---

## Despliegue

El proyecto está configurado para desplegarse en **Vercel** mediante el adaptador `@astrojs/vercel`. Simplemente conecta el repositorio en Vercel y configura las variables de entorno en el panel del proyecto.

---

## Diseño

La web sigue una estética **retro/cyberpunk**:

- **Paleta de colores:** gradientes ámbar sobre fondos oscuros
- **Tipografía:** Roboto con letter-spacing expandido
- **Efectos:** scanlines, viñetas y elementos inspirados en CRT
- **Interacciones:** animaciones suaves en hover y transiciones

---

## Contribuir

¡Las contribuciones son bienvenidas! Puedes:

- 🎨 Mejorar la experiencia visual
- 💻 Añadir funcionalidades o corregir bugs
- 📝 Mejorar textos o traducir contenido

Por favor, abre un issue o un pull request. Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

---

## Licencia

Proyecto open source bajo licencia [MIT](LICENSE).

## Contacto

- **Web:** [hackudc.gpul.org](https://hackudc.gpul.org)
- **Organización:** [GPUL - Universidad de A Coruña](https://gpul.org)
- **Email:** hackudc@gpul.org

---

Hecho con ❤️ por GPUL en A Coruña
