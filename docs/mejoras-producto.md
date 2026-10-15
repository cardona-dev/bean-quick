# Mejoras de producto — Bean Quick

Lista de cambios concretos sobre el borrador de Bean Quick (pedido anticipado en cafeterías). Cada ítem incluye el motivo de producto o de psicología y el estado.

## Aplicadas

- **Home armada con Atomic Design.** Átomos (`Button`, `Badge`, `Heading`), moléculas (`PrimaryCta`, `OrderStateBadge`, `FeaturePoint`, `ProductSpotlight`) y organismos (`Hero`, `BeanScene`, `PromiseSection`, `OrderJourney`, `FeaturedShelf`) componen la página pública. Motivo: una jerarquía visible reduce la carga de decidir; la persona ve una promesa, el recorrido del pedido y un solo botón, en lugar de una página plana. Estado: `applied`.

- **Animaciones sutiles de entrada y hover.** El héroe entra con un desplazamiento corto y los botones y tarjetas cambian con una transición breve al pasar el cursor. Motivo: el movimiento confirma que la interfaz responde, sin competir con la acción de pedir. Estado: `applied`.

- **Una animación 3D continua.** Un prisma hexagonal gira en CSS 3D en el héroe (`data-testid="bean-3d"`). Motivo: el objeto da una ancla visual de marca (el grano, la celda) y mantiene la página viva mientras la persona lee la promesa. No reemplaza el llamado a la acción. Estado: `applied`.

- **Página pública interactiva, en español.** El botón dominante «Ver menú» navega; sin token va a `/login` y con token de cliente a `/cliente/dashboard`. Las rutas `/login`, `/register` y `/solicitud-empresa` siguen siendo formularios usables. Motivo: una sola acción principal evita la parálisis de elegir entre varios caminos iguales (ley de Hick). Estado: `applied`.

- **Promesa de pedir, pagar y recoger.** El texto del héroe y la sección «Tu café, listo al llegar» dicen que se pide y se paga antes de llegar y que el pedido se recoge listo. Motivo: nombrar el alivio (no hacer fila) antes del menú baja la ansiedad de la espera. Estado: `applied`.

- **Seis estados del pedido con color propio.** Pendiente, Pagado, Preparando, Listo, Entregado y Cancelado se muestran como insignias distintas. Cancelado es alcanzable desde Pagado. Motivo: cada color responde «¿en qué va lo mío?» sin obligar a leer un párrafo. Estado: `applied`.

- **Si destacados falla, la home no queda en blanco.** El héroe, la promesa y los estados se pintan igual, y el estante muestra un texto de respaldo en lugar de un cargando eterno. Motivo: un catálogo caído no debe castigar la intención de pedir; la persona conserva el camino al menú. Estado: `applied`.

- **Un carrito, una cafetería.** `canAddProductToCart` rechaza un producto de otra cafetería si el carrito ya tiene una, y el API de agregar hace lo mismo. Motivo: mezclar locales rompe la recogida en un solo lugar y genera pedidos imposibles de preparar. Estado: `applied`.

- **Registro público solo crea clientes.** `POST /api/register` ignora `rol=admin` (y cualquier otro rol) y guarda siempre `cliente`. La contraseña queda hasheada. Motivo: el alta abierta no puede convertirse en una puerta a la oficina de administración; la confianza del sistema depende de que el rol no lo elija quien se registra. Estado: `applied`.

- **Cada ruta exige el rol que le corresponde.** Invitados reciben 401 en el carrito. Cliente y empresa reciben 403 en mutaciones de admin. Un cliente no crea productos de empresa. Una empresa no edita ni borra el producto de otra ni cambia el estado del pedido de otra. Nadie inicia el pago de un pedido ajeno. Un admin sí puede leer sus rutas. Motivo: ver el pedido o el menú de otro negocio se siente como una filtración, aunque sea un error de permiso. Estado: `applied`.

- **El webhook de Mercado Pago exige firma antes de tocar pago o stock.** Sin firma válida no cambia `estado_pago` ni el inventario. Con firma válida y un pago aprobado confirmado, el pedido pasa a Pagado y se descuenta stock. La consulta al proveedor pasa por un puerto (`PaymentLookup`) para probar esa decisión sin llamar a Mercado Pago. Motivo: una notificación falsa no debe marcar un café como pagado ni vaciar la vitrina. Estado: `applied`.

## Diferidas

- **Aplicación nativa.** El pedido anticipado ya cabe en el navegador del celular; una app no cambia la promesa de recoger listo y sí alarga el alcance de esta entrega. Estado: `deferred`.

- **Métricas de ventas en el dashboard.** Ayudan a la cafetería después, pero no hacen más clara la decisión de pedir y pagar antes de llegar. Estado: `deferred`.

- **Tratamiento 3D en los paneles de admin y empresa.** Esos paneles son de trabajo repetido; el movimiento 3D distrae la gestión de pedidos. Estado: `deferred`.

- **Reescritura hexagonal de Laravel.** Solo el puerto de consulta del pago hacía falta para probar la firma sin salir a Mercado Pago. Mover controladores y modelos a hexágonos no mejora la recogida del café. Estado: `deferred`.

- **Cobro real en Mercado Pago, Docker y certificación WCAG.** Requieren credenciales, un entorno de despliegue o una auditoría formal que esta verificación no ejecuta. Estado: `deferred`.
