# Frontend - Sistema de Gestion de Perfumes

SPA con React + Vite + TypeScript + Tailwind CSS.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173 (proxy a backend en :3001)
npm run build    # Build produccion
```

## Vistas

1. **Dashboard** (`/`) - Metricas, grafico de ventas y alertas de stock.
2. **Inventario** (`/inventario`) - Tabla con busqueda/filtros y registro rapido de ventas.
3. **CRM Re-compra** (`/crm`) - Lista de clientes sin compras hace >120 dias con link a WhatsApp.

## Configuracion

El dev-server de Vite ya redirige `/api/*` al backend en `:3001`. Si tu backend corre en otro puerto, edita `vite.config.ts`.