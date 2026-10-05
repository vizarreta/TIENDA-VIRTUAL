# Entrega de la tienda virtual

La aplicación existente incluye catálogo con filtros, carrito, registro e inicio
de sesión, pedidos, idiomas español/inglés y conversor de monedas.

## Publicación en Netlify

1. Completar el registro en https://app.netlify.com/signup y verificar el correo.
2. Importar el repositorio de la tienda desde la cuenta de GitHub correspondiente.
3. Usar la raíz del repositorio como directorio base. El archivo `netlify.toml`
   define el comando `npm run build:frontend`, la carpeta `frontend/dist` y la
   redirección para las rutas de React.
4. Antes de compilar, configurar `VITE_API_URL` con la URL HTTPS del backend,
   incluyendo `/api`. La API NestJS requiere alojamiento separado y una base de
   datos persistente. Autorizar el origen del frontend en CORS del backend.
5. Si se usa OAuth, configurar también `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` y las redirecciones correspondientes. No introducir
   claves privadas en variables `VITE_`: estas son visibles en el navegador.
6. Verificar catálogo, carrito e inicio de sesión en la URL publicada.

Documentación: https://docs.netlify.com/build/configure-builds/monorepos/

## Imágenes para Classroom

`output/entrega-classroom/` contiene copias de capturas existentes del proyecto:

- `01-carrito.png`: catálogo filtrado y carrito con total.
- `02-vista-movil.png`: catálogo adaptable en inglés.
- `03-conversor.png`: conversor de monedas.

Estas imágenes son registros anteriores de la aplicación local. No acreditan
un despliegue nuevo en Netlify ni la creación de una cuenta.

Para adjuntarlas, abrir la tarea de Classroom, seleccionar «Añadir o crear»,
«Archivo» y cargar los PNG. Comprobar los adjuntos antes de entregar.

## Estado de esta preparación

- Compilación del frontend completada.
- Configuración de Netlify añadida y URL de API configurable.
- Pendientes: registro/acceso a Netlify, URL del backend, publicación y enlace
  de la tarea de Classroom para adjuntar las imágenes.
- Esta sesión no ejecutó agentes adicionales; no se afirma una ejecución
  multiagente como evidencia del curso.
