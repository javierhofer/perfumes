import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getContainer } from '../../shared/container';
import { seedDatabase } from '../seed/seedData';
import { buildPerfumesRouter } from './routes/perfumes.routes';
import { buildVentasRouter } from './routes/ventas.routes';
import { buildClientesRouter } from './routes/clientes.routes';
import { buildDashboardRouter } from './routes/dashboard.routes';
import { buildConfiguracionRouter } from './routes/configuracion.routes';
import { initTelegramBot } from '../telegram/telegramBot';
import { StockInsuficienteError, ClienteNoEncontradoError, PerfumeNoEncontradoError } from '../../application/use-cases/RegistrarVentaUseCase';
import { TelefonoDuplicadoError } from '../../application/use-cases/CrearClienteUseCase';
import { PagoInvalidoError } from '../../application/use-cases/RegistrarPagoClienteUseCase';

export const buildApp = async () => {
  dotenv.config();
  seedDatabase();

  const app = express();
  app.use(cors());

  await initTelegramBot();

  app.use(express.json());

  const c = getContainer();

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/perfumes', buildPerfumesRouter(c.useCases.listarPerfumes));
  app.use('/api/ventas', buildVentasRouter(c.useCases.registrarVenta, c.useCases.listarVentas));
  app.use(
    '/api/clientes',
    buildClientesRouter({
      listar: c.useCases.listarClientes,
      crear: c.useCases.crearCliente,
      actualizar: c.useCases.actualizarCliente,
      eliminar: c.useCases.eliminarCliente,
      recompra: c.useCases.recontacto,
      ficha: c.useCases.fichaCliente,
      registrarPago: c.useCases.registrarPago,
      clienteRepo: c.repos.clienteRepo,
    })
  );
  app.use('/api/dashboard', buildDashboardRouter(c.useCases.metrics, c.useCases.alertasStock));
  app.use('/api/configuracion', buildConfiguracionRouter(c.useCases.obtenerConfig, c.useCases.actualizarConfig));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof StockInsuficienteError) {
      return res.status(409).json({ error: err.message, code: 'STOCK_INSUFICIENTE' });
    }
    if (err instanceof ClienteNoEncontradoError || err instanceof PerfumeNoEncontradoError) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    if (err instanceof TelefonoDuplicadoError) {
      return res.status(409).json({ error: err.message, code: 'TELEFONO_DUPLICADO' });
    }
    if (err instanceof PagoInvalidoError) {
      return res.status(400).json({ error: err.message, code: 'PAGO_INVALIDO' });
    }
    console.error('[error]', err);
    res.status(500).json({ error: err.message });
  });

  return app;
};