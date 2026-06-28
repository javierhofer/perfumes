import { Router } from 'express';
import { RegistrarVentaUseCase } from '../../../application/use-cases/RegistrarVentaUseCase';
import { ListarVentasUseCase } from '../../../application/use-cases/ListarVentasUseCase';

export const buildVentasRouter = (
  registrar: RegistrarVentaUseCase,
  listar: ListarVentasUseCase
): Router => {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      res.json(await listar.execute());
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { clienteId, productoId, cantidad, tipoPago } = req.body;
      const resultado = await registrar.execute({ clienteId, productoId, cantidad, tipoPago });
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  });

  return router;
};