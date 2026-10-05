# 🛒 Tienda Virtual — Arquitectura N-Capas

Aplicación web de comercio electrónico con carrito de compras, implementada con arquitectura en N-Capas y estructura de monorepo.

Configuracion actual, pedidos y pruebas: [guia de verificacion](docs/verification.md).

Organizacion del codigo y reglas para contribuir: [arquitectura modular](docs/architecture.md).

## 📁 Estructura del Proyecto

```
tienda-virtual/
├── frontend/                 # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Componentes UI reutilizables
│   │   ├── context/          # React Context (CartContext)
│   │   ├── hooks/            # Custom hooks (useProducts, useCartApi)
│   │   ├── providers/        # Proveedores (QueryProvider)
│   │   ├── services/         # Servicios API (Axios)
│   │   ├── utils/            # Utilidades (formatCurrency)
│   │   ├── locales/          # i18n (es/en)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                  # NestJS + Prisma ORM
│   ├── src/
│   │   ├── products/         # Módulo de productos
│   │   ├── cart/             # Módulo de carrito
│   │   ├── orders/           # Módulo de órdenes
│   │   ├── users/            # Módulo de usuarios
│   │   ├── billing/          # Módulo de facturación
│   │   ├── reviews/          # Módulo de reseñas
│   │   └── prisma/           # Prisma Service
│   ├── prisma/
│   │   ├── schema.prisma     # Esquema de BD
│   │   └── seed.ts           # Datos iniciales
│   ├── package.json
│   └── tsconfig.json
│
├── packages/
│   └── shared-types/         # Tipos TypeScript compartidos
│       ├── src/
│       │   └── index.ts      # Interfaces: Product, CartItem, Order, etc.
│       ├── package.json
│       └── tsconfig.json
│
├── supabase/
│   └── schema.sql            # Esquema SQL para Supabase (PostgreSQL)
│
├── .github/
│   └── workflows/            # CI/CD pipelines
│
├── .husky/                   # Git hooks
├── turbo.json                # Configuración Turborepo
├── commitlint.config.js      # Configuración commitlint
├── package.json              # Workspace root
├── .gitignore
└── README.md
```

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Presentación (UI) | React 18 + Vite + Tailwind CSS |
| Lógica de Negocio (BLL) | NestJS (TypeScript) |
| Acceso a Datos (DAL) | Prisma ORM |
| Base de Datos | SQLite (dev) / PostgreSQL (prod) |
| Tipos Compartidos | TypeScript (@tienda-virtual/shared-types) |
| Gestión de Estado | React Context + TanStack Query |
| Internacionalización | i18next + react-i18next |

## Funciones Stateful y Stateless

| Tipo | Nombre | Archivo |
|---|---|---|
| 🔴 Stateful | `CartContext` | `frontend/src/context/CartContext.tsx` |
| 🔴 Stateful | `ProductCatalog` | `frontend/src/components/ProductCatalog.tsx` |
| 🔵 Stateless | `ProductCard` | `frontend/src/components/ProductCard.tsx` |
| 🔵 Stateless | `formatCurrency()` | `frontend/src/utils/formatCurrency.ts` |

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js >= 20.0.0
- npm >= 10.0.0

### Instalación completa (Monorepo)

```bash
# Instalar dependencias de todos los workspaces
npm install

# Configurar backend/.env a partir de backend/.env.example.
# Si ya existe, completar las variables faltantes sin sobrescribir sus valores.
# Para desarrollo local: FRONTEND_ORIGIN=http://localhost:5173
# Generar JWT_SECRET con el comando indicado en backend/.env.example.

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones y seed
npm run db:migrate
npm run db:seed
```

### Desarrollo (Dos terminales)

**Terminal 1 - Backend:**
```bash
npm run start:dev --workspace=backend
# o: cd backend && npm run start:dev
# Servidor en http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
npm run dev --workspace=frontend
# o: cd frontend && npm run dev
# App en http://localhost:5173
```

### Comandos Útiles (desde root)

```bash
# Desarrollo concurrente
npm run dev

# Build de todos los workspaces
npm run build

# Build individual
npm run build:frontend
npm run build:backend

# Linting
npm run lint
npm run lint:fix

# Formateo
npm run format
npm run format:check

# Base de datos
npm run db:generate   # Prisma generate
npm run db:migrate    # Prisma migrate dev
npm run db:seed       # Ejecutar seed
npm run db:studio     # Prisma Studio
```

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/products | Listar productos |
| GET | /api/products/search?q=term | Buscar productos |
| GET | /api/products/:id | Obtener producto |
| GET | /api/cart | Ver carrito |
| POST | /api/cart | Agregar al carrito |
| PATCH | /api/cart/:id | Actualizar cantidad |
| DELETE | /api/cart/:id | Eliminar del carrito |
| DELETE | /api/cart/clear | Vaciar carrito |

## 📝 Convenciones de Commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[ámbito opcional]: <descripción>

[body opcional]

[footer opcional]
```

**Tipos permitidos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `revert`

**Ejemplos:**
- `feat(cart): add quantity selector to cart items`
- `fix(products): handle empty search results correctly`
- `docs: update API endpoints documentation`
- `refactor(shared-types): add Invoice interface`

## 🔧 Herramientas de Calidad

- **ESLint** + **Prettier**: Linting y formateo consistente
- **Husky**: Git hooks (pre-commit, commit-msg)
- **lint-staged**: Ejecuta linters solo en archivos modificados
- **commitlint**: Valida mensajes de commit
- **TypeScript**: Tipado estricto en todo el proyecto
- **Turborepo**: Build orchestration (opcional)

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm run test

# En modo watch
npm run test:watch
```

## 📦 Despliegue

### Frontend (Vercel/Netlify)
```bash
npm run build:frontend
# Deploy dist/ folder
```

### Backend (Railway/Render/Docker)
```bash
npm run build:backend
# Deploy build/ folder
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.
