# Auditoría OWASP Top 10 (2021) — Bean Quick

Revisión del código que se entrega. Cada categoría usa el nombre oficial 2021 y un estado: `pass`, `fixed` o `residual`.

## Broken Access Control — fixed

El borrador dejaba `/api/admin/*`, `/api/empresa/*` y `/api/cliente/*` solo detrás de `auth:sanctum`, y `POST /api/register` aceptaba `rol=admin`.

Ahora el registro público crea únicamente `cliente`. Los grupos de rutas exigen `IsAdmin`, `IsEmpresa` o `IsCliente`. Una empresa no actualiza ni borra el producto de otra ni cambia el estado de un pedido ajeno. `PagoController::pagar` rechaza un pedido de otro usuario.

Evidencia: `back-end/tests/Feature/AccessAndPaymentTest.php` (registro con `rol=admin`, 401 del carrito, 403 de cliente y empresa, lectura de admin, producto y pedido cruzados, pago ajeno).

## Cryptographic Failures — pass

Las contraseñas nuevas se guardan con `Hash::make`. El test de registro comprueba que la columna `password` no es el texto enviado y que `Hash::check` coincide. La firma del webhook se compara con `hash_equals`.

Evidencia: `RegisteredUserController::store` y el test `public register with rol=admin creates a cliente and stores a password hash`.

## Injection — pass

Las consultas de acceso y de pedido usan Eloquent y parámetros enlazados. El nombre de registro pasa por validación y `strip_tags`. No hay SQL armado con el cuerpo del webhook.

Evidencia: `ProductoController`, `PedidoController::actualizarEstado` y `RegisteredUserController`.

## Insecure Design — fixed

El alta pública ya no elige el rol. El carrito rechaza una segunda cafetería (`canAddProductToCart` en la UI y el mismo bloqueo en `CarritoController::agregar`). Los estados de pedido visibles son solo Pendiente, Pagado, Preparando, Listo, Entregado y Cancelado, y Cancelado es alcanzable desde Pagado.

Evidencia: `front-end/src/domain/orderRules.js`, `front-end/tests/orderRules.test.js` y `CarritoController::agregar`.

## Security Misconfiguration — pass

`config/app.php` deja `debug` en falso si no hay variable de entorno. CORS permite orígenes explícitos de desarrollo (`config/cors.php`), no `*`, y `supports_credentials` está en falso. El secreto del webhook sale de `MERCADOPAGO_WEBHOOK_SECRET`; si falta, la firma se rechaza.

Evidencia: `config/app.php`, `config/cors.php`, `config/services.php`, `MercadoPagoSignature::valid`.

## Vulnerable and Outdated Components — residual

El frontend dejó de importar `framer-motion` (no está declarado en `package.json`) y usa `motion`, que sí está instalado. No se actualizó el árbol completo de Laravel ni de npm en esta entrega, así que una alerta futura de dependencias queda fuera de este cambio.

Evidencia: `front-end/package.json` y los imports `motion/react` en `Hero.jsx` y `Login.jsx`.

## Identification and Authentication Failures — fixed

El registro exige contraseña confirmada, de 8 caracteres, con mayúsculas y números, y ya no emite un token de administrador. Las rutas de carrito, pago y panel siguen en Sanctum. Un invitado no lee el carrito.

Evidencia: `RegisteredUserController::store` y los tests de registro, carrito y pago en `AccessAndPaymentTest.php`.

## Software and Data Integrity Failures — fixed

`POST /api/webhook/mercadopago` verifica la firma HMAC del proveedor antes de leer el pago y antes de escribir `estado_pago` o stock. Una firma inválida responde 401 y deja el pedido igual, aunque la consulta de pago devolvería `approved`. Una firma válida más un pago aprobado confirmado marca el pedido como Pagado y descuenta stock. La consulta al proveedor está detrás de `PaymentLookup` para no llamar a Mercado Pago en la prueba.

Evidencia: `app/Payments/MercadoPagoSignature.php`, `PagoController::webhook` y los dos tests de webhook en `AccessAndPaymentTest.php`.

## Security Logging and Monitoring Failures — fixed

Un rol insuficiente y una firma de webhook inválida quedan en el log (`Log::warning`) con usuario o IP y ruta, sin contraseña ni secreto. El webhook ya no registra el cuerpo completo de la notificación.

Evidencia: `IsAdmin`, `IsEmpresa`, `IsCliente` y `PagoController::webhook`.

## Server-Side Request Forgery — pass

El id de pago no se usa como URL. Tras una firma válida, `PaymentLookup` consulta solo al cliente de Mercado Pago. Una notificación sin firma no dispara esa consulta.

Evidencia: `MercadoPagoPaymentLookup::find` y el retorno 401 temprano de `PagoController::webhook`.
