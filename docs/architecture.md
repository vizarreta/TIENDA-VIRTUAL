# Arquitectura modular

Ver tambien el [diagrama de componentes](diagrama-componentes.md) y el
[servicio externo consumido desde React](servicio-externo.md).

El proyecto sigue siendo un monorepo con React y NestJS. Los modulos tienen
responsabilidades separadas, pero no son microservicios ni despliegues independientes.
No se agregaron frameworks ni un repositorio generico sobre Prisma.

## Frontend

```text
components/ProductCatalog.tsx     presentacion y eventos de la vista
          |
modules/catalog/useCatalog.ts    estado, carga y coordinacion
          |                 |
catalog.selectors.ts        hooks/useProducts.ts
reglas puras                       |
                            services/products.api.ts
                                   |
                            services/http-client.ts
                                   |
                            services/session-storage.ts
```

| Modulo | Responsabilidad | No debe conocer |
| --- | --- | --- |
| `services/products.api.ts` | Productos, categorias y administracion | JSX, estado del carrito |
| `services/cart.api.ts` | Operaciones HTTP del carrito | Componentes o pedidos |
| `services/auth.api.ts` | Login, registro e intercambio OAuth | Vistas, almacenamiento |
| `services/orders.api.ts` | Creacion, consulta y cancelacion de pedidos | Catalogo y componentes |
| `services/http-client.ts` | Transporte y encabezados comunes | Reglas de negocio |
| `services/session-storage.ts` | Token, UUID del carrito e idempotencia | Axios y React |
| `modules/catalog/catalog.selectors.ts` | Busqueda, filtro y orden inmutables | Red, navegador, React |
| `context/CartContext.tsx` | Unica fuente de estado del carrito en pantalla | Detalles de Axios |

Los servicios HTTP retornan respuestas Axios tipadas y propagan sus errores.
El contexto o hook decide el estado visual; `utils/apiError.ts` traduce errores a
claves i18n. No se convierte una solicitud fallida en una respuesta exitosa vacia.

`services/api.ts` conserva reexportaciones por compatibilidad. El codigo nuevo
importa directamente el servicio de su dominio. Los hooks antiguos sin consumidores
de `useCartApi.ts` se retiraron: creaban otra sesion y una segunda cache del carrito.
Para el carrito, usar `useCart` de `context/CartContext.tsx`.

`ProductCard` recibe producto, accion y estado deshabilitado mediante props;
no importa el contexto del carrito. Puede reutilizarse en otra vista.
Los eventos de actualizacion del catalogo tienen un contrato nombrado en
`catalog-events.ts`, sin importar una pantalla desde otra.

## Backend

```text
HTTP -> Controller -> DTO validado -> Service -> Prisma
                                       |
                         reglas puras / servicios especificos
```

| Archivo | Donde trabajar |
| --- | --- |
| `cart/cart.controller.ts` | Rutas y adaptacion HTTP |
| `cart/cart.dto.ts` | Validacion de datos de entrada del carrito |
| `cart/cart.service.ts` | Casos de uso y pertenencia al carrito |
| `orders/orders.service.ts` | Coordinacion, propiedad e idempotencia |
| `orders/order-pricing.ts` | Calculo en centimos, limites y errores de dominio |
| `orders/order-inventory.service.ts` | Reserva y restitucion de stock |
| `prisma/transaction-policy.ts` | Limites y clasificacion de reintentos |
| `prisma/prisma.service.ts` | Conexion y ejecucion de transacciones |

El calculo del pedido recibe datos simples y devuelve otra instantanea, sin mutar
el carrito. Su excepcion `OrderPricingError` no depende de Nest. El servicio de
pedidos la convierte en HTTP 400 y deja propagarse errores inesperados.

Reserva, creacion y vaciado del carrito comparten **una transaccion**. El servicio
de inventario recibe esa transaccion; no crea otra ni confirma parcialmente el
pedido. Los callbacks que Prisma puede reintentar no deben enviar correos, cobrar
ni producir otros efectos externos.

## Ejemplo de una regla aislada

```typescript
const pricing = calculateOrderPricing([
  { productId: 1, quantity: 3, product: { name: 'Ejemplo', price: 0.10 } },
]);
// pricing.totalCents === 30
```

El filtrado recorre n productos y ordena k coincidencias: O(n + k log k), con
O(k) memoria adicional. La busqueda se normaliza una vez, fuera del recorrido.
El calculo de pedidos es O(n), con O(n) espacio para conservar sus lineas.

## Como agregar una funcionalidad

1. Definir el contrato de entrada y salida; evitar `any` y reflejar campos nulos.
2. Implementar reglas sin dependencias de UI o persistencia cuando sea posible.
3. Mantener la coordinacion en el servicio o hook de su dominio.
4. Conectar la vista mediante props y acciones explicitas.
5. Agregar pruebas de casos normales, limites y errores.

Los contratos compartidos estan en `packages/shared-types/src/index.ts`. Incluyen
tipos historicos; `SavedOrder` corresponde a la API de pedidos actual. No utilizar
el antiguo `Order` para ese endpoint.

## Verificacion

- `npm test`: pruebas unitarias de reglas, sesiones y transporte, mas regresiones HTTP.
- `npm run test --workspace=frontend`: reglas y APIs sin navegador ni servidor.
- `npm run test --workspace=backend`: calculos, reintentos y API con SQLite aislada.
- `npm run build`: comprobacion TypeScript y compilacion de todos los workspaces.

Las pruebas frontend usan el compilador TypeScript ya instalado para cargar los
modulos en contextos aislados; el transporte Axios usa un adaptador en memoria.
No requieren red, proveedores OAuth ni credenciales de desarrollo.

Quedan pantallas grandes, como administracion, que pueden dividirse siguiendo el
mismo patron cuando cambie su funcionalidad. Esta refactorizacion no reescribe toda
la aplicacion ni cambia el esquema de datos.
