# 🛒 Tienda Virtual — Arquitectura N-Capas

Aplicación web de comercio electrónico con carrito de compras, implementada con arquitectura en N-Capas.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Presentación (UI) | React 18 + Vite + Tailwind CSS |
| Lógica de Negocio (BLL) | NestJS (TypeScript) |
| Acceso a Datos (DAL) | Prisma ORM |
| Base de Datos | SQLite |

## Funciones Stateful y Stateless

| Tipo | Nombre | Archivo |
|---|---|---|
| 🔴 Stateful | `CartContext` | `frontend/src/context/CartContext.tsx` |
| 🔴 Stateful | `ProductCatalog` | `frontend/src/components/ProductCatalog.tsx` |
| 🔵 Stateless | `ProductCard` | `frontend/src/components/ProductCard.tsx` |
| 🔵 Stateless | `formatCurrency()` | `frontend/src/utils/formatCurrency.ts` |

## Instalación y Ejecución

### Backend (Terminal 1)
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run start:dev
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

### Abrir en el navegador
```
http://localhost:5173
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
