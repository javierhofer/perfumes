import { buildApp } from './app';

const PORT = Number(process.env.PORT) || 3001;

(async () => {
  const app = await buildApp();
  app.listen(PORT, () => {
    console.log(`[server] API escuchando en http://localhost:${PORT}`);
    console.log(`[server] Endpoints:`);
    console.log(`   GET    /api/health`);
    console.log(`   GET    /api/perfumes`);
    console.log(`   GET    /api/ventas`);
    console.log(`   POST   /api/ventas`);
    console.log(`   GET    /api/clientes`);
    console.log(`   POST   /api/clientes`);
    console.log(`   PUT    /api/clientes/:id`);
    console.log(`   DELETE /api/clientes/:id`);
    console.log(`   GET    /api/clientes/:id/ficha`);
    console.log(`   POST   /api/clientes/:id/pagos`);
    console.log(`   GET    /api/clientes/recontacto`);
    console.log(`   GET    /api/dashboard/metrics`);
    console.log(`   GET    /api/dashboard/alertas-stock`);
    console.log(`   GET    /api/configuracion`);
    console.log(`   PUT    /api/configuracion`);

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn(
        '[server] Telegram NO configurado: falta TELEGRAM_BOT_TOKEN. El bot no iniciara.'
      );
    } else {
      console.log('[server] Bot de Telegram activo. Comandos: ventas, top, ayuda (es/en).');
    }
    if (!process.env.TELEGRAM_ALLOWED_USERS?.trim()) {
      console.warn('[server] TELEGRAM_ALLOWED_USERS vacio. Todos los mensajes seran rechazados (defensa por default).');
    }
  });
})();