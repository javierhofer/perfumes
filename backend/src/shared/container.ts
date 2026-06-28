import { JsonClienteRepository } from '../infrastructure/persistence/JsonClienteRepository';
import { JsonPagoRepository } from '../infrastructure/persistence/JsonPagoRepository';
import { JsonPerfumeRepository } from '../infrastructure/persistence/JsonPerfumeRepository';
import { JsonVentaRepository } from '../infrastructure/persistence/JsonVentaRepository';
import { JsonConfiguracionRepository } from '../infrastructure/persistence/JsonConfiguracionRepository';

import { RegistrarVentaUseCase } from '../application/use-cases/RegistrarVentaUseCase';
import { ObtenerAlertasStockUseCase } from '../application/use-cases/ObtenerAlertasStockUseCase';
import { ObtenerClientesParaRecompraUseCase } from '../application/use-cases/ObtenerClientesParaRecompraUseCase';
import { ObtenerDashboardMetricsUseCase } from '../application/use-cases/ObtenerDashboardMetricsUseCase';
import { ListarPerfumesUseCase } from '../application/use-cases/ListarPerfumesUseCase';
import { ListarVentasUseCase } from '../application/use-cases/ListarVentasUseCase';
import { ListarClientesUseCase } from '../application/use-cases/ListarClientesUseCase';
import { CrearClienteUseCase } from '../application/use-cases/CrearClienteUseCase';
import { ActualizarClienteUseCase } from '../application/use-cases/ActualizarClienteUseCase';
import { EliminarClienteUseCase } from '../application/use-cases/EliminarClienteUseCase';
import { ObtenerFichaClienteUseCase } from '../application/use-cases/ObtenerFichaClienteUseCase';
import { RegistrarPagoClienteUseCase } from '../application/use-cases/RegistrarPagoClienteUseCase';
import { ObtenerConfiguracionUseCase } from '../application/use-cases/ObtenerConfiguracionUseCase';
import { ActualizarConfiguracionUseCase } from '../application/use-cases/ActualizarConfiguracionUseCase';

const buildContainer = () => {
  const perfumeRepo = new JsonPerfumeRepository();
  const clienteRepo = new JsonClienteRepository();
  const ventaRepo = new JsonVentaRepository();
  const pagoRepo = new JsonPagoRepository();
  const configRepo = new JsonConfiguracionRepository();

  return {
    repos: { perfumeRepo, clienteRepo, ventaRepo, pagoRepo, configRepo },
    useCases: {
      registrarVenta: new RegistrarVentaUseCase(perfumeRepo, clienteRepo, ventaRepo),
      alertasStock: new ObtenerAlertasStockUseCase(perfumeRepo, configRepo),
      recontacto: new ObtenerClientesParaRecompraUseCase(clienteRepo, ventaRepo, perfumeRepo, configRepo),
      metrics: new ObtenerDashboardMetricsUseCase(perfumeRepo, ventaRepo, clienteRepo),
      listarPerfumes: new ListarPerfumesUseCase(perfumeRepo),
      listarVentas: new ListarVentasUseCase(ventaRepo, clienteRepo, perfumeRepo),
      listarClientes: new ListarClientesUseCase(clienteRepo),
      crearCliente: new CrearClienteUseCase(clienteRepo),
      actualizarCliente: new ActualizarClienteUseCase(clienteRepo),
      eliminarCliente: new EliminarClienteUseCase(clienteRepo, ventaRepo),
      fichaCliente: new ObtenerFichaClienteUseCase(clienteRepo, ventaRepo, pagoRepo, perfumeRepo),
      registrarPago: new RegistrarPagoClienteUseCase(clienteRepo, ventaRepo, pagoRepo),
      obtenerConfig: new ObtenerConfiguracionUseCase(configRepo),
      actualizarConfig: new ActualizarConfiguracionUseCase(configRepo),
    },
  };
};

export type Container = ReturnType<typeof buildContainer>;

let cached: Container | null = null;
export const getContainer = (): Container => {
  if (!cached) cached = buildContainer();
  return cached;
};