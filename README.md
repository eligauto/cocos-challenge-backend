# Cocos Challenge Backend

API REST para gestion de portfolio de inversiones, busqueda de activos y envio de ordenes al mercado.

## Tecnologias

- **NestJS** - Framework de Node.js
- **TypeORM** - ORM para PostgreSQL
- **Jest** - Testing
- **class-validator** - Validacion de DTOs

### Flujo de Dependencias

```
[HTTP Request] → [Controller] → [Use Case] → [Domain] ← [Repository] ← [Database]
                   (adapter)     (application)  (core)    (adapter)
```

**Regla de Dependencia**: Las dependencias siempre apuntan hacia el dominio.

## Instalacion

```bash
npm install
```

## Ejecucion

```bash
npm run start:dev

```

## Tests

```bash
npm run test
```

## API Endpoints (Resumen)
Les dejo documentado los endpoints principales de la API. De todas formas deje el Postman collection para que puedan probarla mas facilmente.
### Portfolio
```
GET /portfolio/:userId
```
Retorna el valor total de la cuenta, efectivo disponible y posiciones del usuario.

### Busqueda de Instrumentos
```
GET /instruments/search?query=PAMP
```
Busca activos por ticker o nombre.

### Crear Orden
```
POST /orders
```
```json
{
  "userId": 1,
  "instrumentId": 31,
  "side": "BUY",
  "type": "MARKET",
  "quantity": 10
}
```
Opciones de `side`: `BUY`, `SELL`, `CASH_IN`, `CASH_OUT`
Opciones de `type`: `MARKET`, `LIMIT`

Se puede enviar `quantity` (cantidad de acciones) o `totalAmount` (monto en pesos).

### Cancelar Orden
```
PATCH /orders/:id/cancel
```
```json
{
  "userId": 1
}
```
Solo se pueden cancelar ordenes con estado `NEW`.

## Decisiones de Diseño

### Arquitectura Hexagonal
- **Dominio aislado**: La logica de negocio no depende de frameworks ni bases de datos
- **Inversion de dependencias**: Los repositorios son interfaces en el dominio, implementadas en infraestructura
- **Testabilidad**: Los casos de uso se testean con mocks sin necesidad de base de datos

### Modelado del Dominio
- **Order**: Entidad central que representa una orden de compra/venta
- **Instrument**: Activo financiero (ACCIONES o MONEDA)
- **Position**: Valor calculado que representa la tenencia de un usuario
- **CASH_IN/CASH_OUT**: Modelados como ordenes sobre el instrumento ARS (tipo MONEDA)

### Validaciones de Negocio
- `BUY`/`SELL` solo permitidos para instrumentos tipo `ACCIONES`
- `CASH_IN`/`CASH_OUT` solo permitidos para instrumentos tipo `MONEDA`
- Ordenes con fondos/acciones insuficientes se guardan con estado `REJECTED`
- Ordenes `MARKET` se ejecutan inmediatamente (`FILLED`)
- Ordenes `LIMIT` quedan pendientes (`NEW`)

### Calculo de Portfolio
- El efectivo disponible se calcula sumando todos los movimientos `FILLED`
- Las posiciones se calculan agregando compras y restando ventas
- Los precios actuales se obtienen del `close` en `marketdata`
