# BLACK CUTS — demo de barbería
Una propuesta de identidad web y reserva interactiva, diseñada por **Tihago Cueva**, Santa Cruz de la Sierra, Bolivia.

## Objetivo
Mostrar cómo una barbería puede presentar sus servicios y guiar al visitante desde la elección del corte hasta un ticket de solicitud.

## Experiencia
- Portada editorial en negro y rojo, fotografía monocromática y lista de precios sobre fondo crema.
- Menú para celular con cierre mediante Escape y enlaces de navegación.
- Selección de servicio desde la pizarra, barbero, fecha y horario.
- Ticket de prueba y agenda ilustrativa por barbero.
- Soporte de movimiento reducido, foco visible y enlace para saltar al formulario.

## Alcance real de la demo
La agenda incluye turnos ficticios y guarda pruebas en localStorage del navegador. **No reserva citas reales, no sincroniza dispositivos y no tiene un panel privado ni servidor.**
Usar nombres y teléfonos ficticios. Las fotos son ilustrativas y se cargan desde Unsplash; las tipografías desde Google Fonts.
El horario y los precios son ejemplos, no datos de un establecimiento verificado. La hora se calcula con el reloj local del dispositivo.

WhatsApp está deshabilitado mientras `WHATSAPP` esté vacío en `app.js`. Un número boliviano configurado habilita un mensaje de consulta: enviarlo no confirma disponibilidad.

## Ejecutar y personalizar
Abrir `index.html` en un navegador, o servir esta carpeta con un servidor estático como Live Server.

| Archivo | Contenido |
| --- | --- |
| index.html | Estructura, contenido y metadatos |
| style.css | Diseño, adaptación a pantallas y estados |
| app.js | Servicios, horarios, selección y almacenamiento de prueba |

Editar `SERVICIOS`, `BARBEROS`, `HORARIO` y `WHATSAPP` al inicio de app.js.
Para reiniciar los turnos de prueba, eliminar la clave `blackcuts_reservas` del almacenamiento local de este sitio.

## Antes de usarlo en un negocio real
Conectar una agenda compartida con validación de disponibilidad en servidor, autenticación del personal, gestión de datos y confirmación real del establecimiento. Sustituir fotografías, ubicación, horarios y contactos por los del negocio.

## Contacto
¿Quieres una página para tu negocio? [Escríbeme](mailto:tihagocueva80@gmail.com) · [GitHub](https://github.com/Tihago2006)
