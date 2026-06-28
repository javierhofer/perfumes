import { Router } from 'express';
import { ListarPerfumesUseCase } from '../../../application/use-cases/ListarPerfumesUseCase';

export const buildPerfumesRouter = (useCase: ListarPerfumesUseCase): Router => {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const { busqueda, marca, fragancia } = req.query;
      const data = await useCase.execute({
        busqueda: busqueda as string | undefined,
        marca: marca as string | undefined,
        fragancia: fragancia as string | undefined,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  return router;
};