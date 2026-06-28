import { Router } from 'express';
import { ListarClientesUseCase } from '../../../application/use-cases/ListarClientesUseCase';
import { ObtenerClientesParaRecompraUseCase } from '../../../application/use-cases/ObtenerClientesParaRecompraUseCase';
import { CrearClienteUseCase } from '../../../application/use-cases/CrearClienteUseCase';
import { ActualizarClienteUseCase } from '../../../application/use-cases/ActualizarClienteUseCase';
import { EliminarClienteUseCase } from '../../../application/use-cases/EliminarClienteUseCase';
import { ObtenerFichaClienteUseCase } from '../../../application/use-cases/ObtenerFichaClienteUseCase';
import { RegistrarPagoClienteUseCase } from '../../../application/use-cases/RegistrarPagoClienteUseCase';
import { IClienteRepository } from '../../../domain/repositories/IClienteRepository';

export interface ClientesRouterDeps {
  listar: ListarClientesUseCase;
  crear: CrearClienteUseCase;
  actualizar: ActualizarClienteUseCase;
  eliminar: EliminarClienteUseCase;
  recompra: ObtenerClientesParaRecompraUseCase;
  ficha: ObtenerFichaClienteUseCase;
  registrarPago: RegistrarPagoClienteUseCase;
  clienteRepo: IClienteRepository;
}

export const buildClientesRouter = (deps: ClientesRouterDeps): Router => {
  const router = Router();
  const { listar, crear, actualizar, eliminar, recompra, ficha, registrarPago, clienteRepo } = deps;

  router.get('/', async (req, res, next) => {
    try {
      const conDeuda = req.query.conDeuda === 'true';
      if (conDeuda) {
        res.json(await clienteRepo.listarConDeuda());
        return;
      }
      const incluirInactivos = req.query.incluirInactivos === 'true';
      res.json(await clienteRepo.listar(!incluirInactivos));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { nombre, telefono, notasPersonales } = req.body;
      const cli = await crear.execute({ nombre, telefono, notasPersonales });
      res.status(201).json(cli);
    } catch (err) {
      next(err);
    }
  });

  router.get('/recontacto', async (_req, res, next) => {
    try {
      res.json(await recompra.execute());
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/ficha', async (req, res, next) => {
    try {
      res.json(await ficha.execute(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const { nombre, telefono, notasPersonales } = req.body;
      const cli = await actualizar.execute({ id: req.params.id, nombre, telefono, notasPersonales });
      res.json(cli);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await eliminar.execute(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/pagos', async (req, res, next) => {
    try {
      const { monto, nota } = req.body;
      const r = await registrarPago.execute({ clienteId: req.params.id, monto, nota });
      res.status(201).json(r);
    } catch (err) {
      next(err);
    }
  });

  return router;
};