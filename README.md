# Sistema de Gestion de Ventas e Inventario - Perfumes

Sistema web para revendedor de perfumes con Clean Architecture en backend y SPA moderna en frontend.

## Stack

- **Backend:** Node.js + TypeScript + Express (Clean Architecture en 3 capas: Domain / Application / Infrastructure).
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Recharts.
- **Persistencia:** JSON file en `backend/data/db.json` (sobrevive reinicios).

## Estructura

```
.
├── backend/   API REST - arquitectura limpia
└── frontend/  SPA React
```

## Como correr

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Levanta en `http://localhost:3001`. La primera vez crea `data/db.json` con datos de seed (15 perfumes, 8 clientes, 14 ventas historicas).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Levanta en `http://localhost:5173`. El proxy de Vite redirige `/api/*` al backend.

### 3. Resetear datos

```bash
cd backend
npm run seed -- --force
```

O eliminar `backend/data/db.json` y reiniciar.

## Funcionalidades

- **Dashboard** con metricas (ventas totales, ganancia neta, stock, cuentas por cobrar), grafico de flujo de ventas y panel de alertas criticas.
- **Inventario** con busqueda, filtro por marca, columna de margen calculado y modal de "registro rapido" de venta.
- **CRM Re-compra** que detecta clientes sin compras hace >120 dias y genera link a WhatsApp con mensaje plantilla pre-redactado.
- **Reglas de negocio:** al vender, el stock se descuenta automaticamente; si queda <=3 unidades, se dispara alerta.