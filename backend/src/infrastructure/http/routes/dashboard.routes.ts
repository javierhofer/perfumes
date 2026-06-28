import { Router } from 'express';
import { ObtenerDashboardMetricsUseCase } from '../../../application/use-cases/ObtenerDashboardMetricsUseCase';
import { ObtenerAlertasStockUseCase } from '../../../application/use-cases/ObtenerAlertasStockUseCase';

export const buildDashboardRouter = (
  metrics: ObtenerDashboardMetricsUseCase,
  alertas: ObtenerAlertasStockUseCase
): Router => {
  const router = Router();

  router.get('/metrics', async (_req, res, next) => {
    try {
      res.json(await metrics.execute());
    } catch (err) {
      next(err);
    }
  });

  router.get('/alertas-stock', async (_req, res, next) => {
    try {
      res.json(await alertas.execute());
    } catch (err) {
      next(err);
    }
  });

  return router;
};