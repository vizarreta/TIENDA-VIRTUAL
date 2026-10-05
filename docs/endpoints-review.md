# Revisión de lógica y endpoints — 2026-10-04

La API NestJS expone 21 rutas funcionales bajo `/api`. El frontend utiliza estas mismas rutas y envía el JWT local y `x-session-id` mediante su cliente HTTP compartido. La verificación de OAuth conserva el token del proveedor.

| Método | Ruta                       | Acceso y comportamiento                                                                                        |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| GET    | `/products`                | Público; productos activos                                                                                     |
| GET    | `/products/search?q=texto` | Público; busca en nombre y descripción; texto obligatorio, de 1 a 200 caracteres tras quitar espacios extremos |
| GET    | `/products/categories`     | Público; categorías                                                                                            |
| GET    | `/products/:id`            | Público; producto activo, 404 si no existe                                                                     |
| GET    | `/products/admin`          | Administrador; incluye inactivos                                                                               |
| POST   | `/products`                | Administrador; crea producto                                                                                   |
| PATCH  | `/products/:id`            | Administrador; modifica solo los campos enviados                                                               |
| DELETE | `/products/:id`            | Administrador; elimina producto; 404 si no existe                                                              |
| GET    | `/cart`                    | UUID en `x-session-id`; devuelve `{ items }`                                                                   |
| POST   | `/cart`                    | Misma sesión; agrega unidades y comprueba stock; devuelve la lista de ítems                                    |
| PATCH  | `/cart/:id`                | Misma sesión; cambia cantidad de un ítem propio                                                                |
| DELETE | `/cart/:id`                | Misma sesión; elimina un ítem propio                                                                           |
| DELETE | `/cart/clear`              | Misma sesión; vacía solo ese carrito                                                                           |
| POST   | `/auth/register`           | Público; crea cliente y devuelve sesión local; 201                                                             |
| POST   | `/auth/login`              | Público; devuelve sesión local; 200 o 401                                                                      |
| POST   | `/auth/supabase/verify`    | JWT válido del proveedor; devuelve sesión local; 200                                                           |
| GET    | `/auth/me`                 | JWT local; perfil sin contraseña                                                                               |
| GET    | `/auth/me/supabase`        | JWT válido del proveedor; identidad verificada                                                                 |
| GET    | `/orders`                  | JWT local; solo pedidos propios                                                                                |
| POST   | `/orders`                  | JWT local y sesión de carrito; checkout transaccional, con `requestId` UUID                                    |
| POST   | `/orders/:id/cancel`       | JWT local; cancela pedido propio pendiente y restituye stock una sola vez                                      |

## Fallos corregidos

- La validación de PATCH dependía de metadatos de `PartialType` que no se heredaban correctamente con las dependencias instaladas. Se definieron validadores explícitos: las ediciones de nombre, precio y stock funcionan; enviar `null` en estos campos o en `isActive` devuelve 400. Imagen, descripción y categoría admiten `null` para limpiarlas.
- Los nombres vacíos tras quitar espacios se rechazan. Los IDs, stock y cantidades se limitan al rango positivo de los enteros de la base; stock permite cero. El precio admite hasta dos decimales y se limita a 21 474 836,47 PEN, coherente con los totales en centavos.
- Las cantidades y los IDs enviados en JSON deben ser números: `true` ya no se convierte en 1.
- Una categoría inexistente devuelve 400; editar o eliminar un producto inexistente devuelve 404. Los errores inesperados siguen propagándose.
- La búsqueda valida `q`, rechaza valores ausentes, vacíos o repetidos y busca también en descripción, manteniendo el filtro de productos activos.
- Un correo OAuth que colisiona con otra cuenta devuelve 409 `EMAIL_IN_USE`; no se enlazan cuentas automáticamente.
- El intercambio OAuth responde con el 200 documentado. Swagger incluye la configuración de autenticación Bearer.
- El tipo de creación de productos del frontend exige stock, como el backend.
- El cargador de pruebas del frontend admite `import.meta.env`; se verifica la URL de API configurada y la predeterminada.

## Verificación y límites

Resultado: 26 pruebas de backend y 21 de frontend aprobadas. Compilación del backend y comprobación TypeScript del frontend aprobadas.

Las pruebas HTTP usan una base SQLite aislada. Cubren permisos, validación, CRUD de productos, aislamiento del carrito, pedidos propios, concurrencia, reserva de la última unidad, rollback, reintentos de checkout y cancelación sin doble restitución. También se comprueba el conflicto OAuth en el servicio con base real, sin contactar al proveedor.

Las pruebas de frontend comprueban transporte, headers, conservación del token OAuth, URL configurada y propagación de errores. Se verifican la compilación del backend y los tipos del frontend.

`billing`, `reviews` y `users` tienen controladores vacíos: no ofrecen rutas funcionales. No hay pasarela de pago ni caducidad automática de reservas. El proveedor OAuth real, CORS en un despliegue externo y PostgreSQL no se validaron en esta revisión local.
