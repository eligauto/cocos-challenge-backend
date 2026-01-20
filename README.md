# Cocos Challenge Backend

API REST para gestión de portfolio de inversiones, busqueda de activos y envio de ordenes al mercado.

## Arquitectura

Este proyecto implementa **Arquitectura Hexagonal** (Ports & Adapters), que permite:

- **Independencia del framework**: El dominio no conoce NestJS
- **Testabilidad**: Facil mockeo de dependencias externas
- **Mantenibilidad**: Separacion clara de responsabilidades
- **Flexibilidad**: Cambiar infraestructura sin afectar el negocio


### Flujo de Dependencias

```
[HTTP Request] → [Controller] → [Use Case] → [Domain] ← [Repository] ← [Database]
                   (adapter)     (application)  (core)    (adapter)
```

**Regla de Dependencia**: Las dependencias siempre apuntan hacia el dominio. El dominio no conoce nada del exterior.

## Instalacion

```bash
npm install
```

## Configuracion

Crear archivo `.env` en la raíz del proyecto:

## Ejecucion

```bash
npm run start:dev

```

## Tests

```bash
npm run test
```

## Decisiones de Diseño

### Por que Arquitectura Hexagonal?

1. **Separacion de concerns**: El dominio contiene la logica de negocio pura sin depender de frameworks o bases de datos.

2. **Inversion de dependencias**: Los repositorios son interfaces en el dominio, implementadas en infraestructura.

3. **Testabilidad**: Podemos testear casos de uso con mocks sin necesidad de base de datos.

### Modelado del Dominio

- **Order**: Entidad central que representa una orden de compra/venta
- **Instrument**: Representa un activo financiero (accion, moneda)
- **Position**: Valor calculado que representa la tenencia de un usuario en un instrumento
- **Money**: Value Object para manejar valores monetarios con precisión

### Consideraciones Adicionales

- Las ordenes CASH_IN/CASH_OUT se modelan como ordenes con el instrumento ARS (MONEDA)
- El calculo de posiciones se realiza agregando todas las ordenes FILLED
- Los precios utilizan el valor `close` del marketdata mas reciente
