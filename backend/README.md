# Backend - Sistema de Gestion de Perfumes

Clean Architecture con Node.js + TypeScript + Express.

## Capas

- **Domain**: entidades (`Perfume`, `Cliente`, `Venta`) y contratos de repositorios. Sin dependencias externas.
- **Application**: casos de uso (`RegistrarVentaUseCase`, `ObtenerAlertasStockUseCase`, etc.).
- **Infrastructure**: persistencia JSON en `data/db.json`, rutas Express, seed inicial.

## Comandos

```bash
npm install
npm run dev      # Levanta en http://localhost:3001
npm run seed     # Re-carga seed (con --force para sobrescribir)
```

## Persistencia

Los datos se guardan en `backend/data/db.json`. Se inicializa automaticamente al arrancar.
Para resetear: borrar `db.json` y reiniciar, o ejecutar `npm run seed -- --force`.

## Endpoints

- `GET  /api/health`
- `GET  /api/perfumes?busqueda=&marca=&fragancia=`
- `GET  /api/ventas`
- `POST /api/ventas` body: `{ clienteId, productoId, cantidad, tipoPago }`
- `GET  /api/clientes`
- `GET  /api/clientes/recontacto`
- `GET  /api/dashboard/metrics`
- `GET  /api/dashboard/alertas-stock`