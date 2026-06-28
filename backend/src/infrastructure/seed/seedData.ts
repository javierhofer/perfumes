import { Perfume } from '../../domain/entities/Perfume';
import { Cliente } from '../../domain/entities/Cliente';
import { Venta } from '../../domain/entities/Venta';
import { Pago } from '../../domain/entities/Pago';
import { cargarDB, guardarDB } from '../persistence/jsonStore';

const diasAtras = (d: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - d);
  return fecha.toISOString();
};

export const seedDatabase = (forzar = false): void => {
  const db = cargarDB();
  if (!forzar && db.perfumes.length > 0) {
    console.log('[seed] DB ya contiene datos, omitiendo seed.');
    return;
  }

  const perfumes: Perfume[] = [
    { id: 'p1', marca: 'Dior', fragancia: 'Sauvage', tipo: 'EDT', mililitros: 100, stock: 3, precioCosto: 45000, precioVenta: 78000 },
    { id: 'p2', marca: 'Dior', fragancia: "J'adore", tipo: 'EDP', mililitros: 100, stock: 8, precioCosto: 52000, precioVenta: 89000 },
    { id: 'p3', marca: 'Chanel', fragancia: 'Bleu de Chanel', tipo: 'EDP', mililitros: 100, stock: 2, precioCosto: 58000, precioVenta: 98000 },
    { id: 'p4', marca: 'Chanel', fragancia: 'Coco Mademoiselle', tipo: 'EDP', mililitros: 100, stock: 6, precioCosto: 61000, precioVenta: 102000 },
    { id: 'p5', marca: 'Chanel', fragancia: 'Chance', tipo: 'EDT', mililitros: 100, stock: 10, precioCosto: 49000, precioVenta: 84000 },
    { id: 'p6', marca: 'Paco Rabanne', fragancia: '1 Million', tipo: 'EDT', mililitros: 100, stock: 12, precioCosto: 28000, precioVenta: 52000 },
    { id: 'p7', marca: 'Paco Rabanne', fragancia: 'Invictus', tipo: 'EDT', mililitros: 100, stock: 9, precioCosto: 26000, precioVenta: 49000 },
    { id: 'p8', marca: 'Paco Rabanne', fragancia: 'Phantom', tipo: 'Colonia', mililitros: 100, stock: 15, precioCosto: 24000, precioVenta: 46000 },
    { id: 'p9', marca: 'Versace', fragancia: 'Eros', tipo: 'EDT', mililitros: 100, stock: 7, precioCosto: 30000, precioVenta: 56000 },
    { id: 'p10', marca: 'Versace', fragancia: 'Dylan Blue', tipo: 'EDT', mililitros: 100, stock: 5, precioCosto: 32000, precioVenta: 58000 },
    { id: 'p11', marca: 'Carolina Herrera', fragancia: 'Bad Boy', tipo: 'EDT', mililitros: 100, stock: 4, precioCosto: 38000, precioVenta: 67000 },
    { id: 'p12', marca: 'Carolina Herrera', fragancia: 'Good Girl', tipo: 'EDP', mililitros: 80, stock: 6, precioCosto: 42000, precioVenta: 72000 },
    { id: 'p13', marca: 'Yves Saint Laurent', fragancia: 'Libre', tipo: 'EDP', mililitros: 90, stock: 11, precioCosto: 54000, precioVenta: 92000 },
    { id: 'p14', marca: 'Yves Saint Laurent', fragancia: 'Y', tipo: 'EDP', mililitros: 100, stock: 8, precioCosto: 48000, precioVenta: 85000 },
    { id: 'p15', marca: 'Jean Paul Gaultier', fragancia: 'Le Male', tipo: 'EDT', mililitros: 125, stock: 13, precioCosto: 35000, precioVenta: 62000 },
  ];

  const clientes: Cliente[] = [
    { id: 'c1', nombre: 'Lucia Mendez', telefono: '+5491155551001', historialCompras: [], notasPersonales: 'Prefiere fragancias frescas. Siempre paga en efectivo.', saldoDeudor: 0, activo: true, etiquetas: ['Frecuente', 'Solo efectivo'] },
    { id: 'c2', nombre: 'Martin Suarez', telefono: '+5491155551002', historialCompras: [], notasPersonales: 'Cliente frecuente de Paco Rabanne. Le gusta recibir recordatorios.', saldoDeudor: 0, activo: true, etiquetas: ['Frecuente', 'VIP'] },
    { id: 'c3', nombre: 'Sofia Castro', telefono: '+5491155551003', historialCompras: [], notasPersonales: 'Cta cte habilitada. Compra perfumes de autor para regalos.', saldoDeudor: 84000, activo: true, etiquetas: ['VIP', 'Cta cte'] },
    { id: 'c4', nombre: 'Diego Fernandez', telefono: '+5491155551004', historialCompras: [], notasPersonales: '', saldoDeudor: 0, activo: true, etiquetas: ['Nuevo'] },
    { id: 'c5', nombre: 'Camila Ruiz', telefono: '+5491155551005', historialCompras: [], notasPersonales: 'Le encantan los florales.', saldoDeudor: 0, activo: true, etiquetas: ['Frecuente'] },
    { id: 'c6', nombre: 'Joaquin Pereira', telefono: '+5491155551006', historialCompras: [], notasPersonales: '', saldoDeudor: 0, activo: true, etiquetas: [] },
    { id: 'c7', nombre: 'Valentina Lopez', telefono: '+5491155551007', historialCompras: [], notasPersonales: 'Cta cte. Compras grandes a fin de mes.', saldoDeudor: 102000, activo: true, etiquetas: ['Cta cte'] },
    { id: 'c8', nombre: 'Sebastian Diaz', telefono: '+5491155551008', historialCompras: [], notasPersonales: 'Vino recomendado por su esposa. Probar Jean Paul Gaultier.', saldoDeudor: 0, activo: true, etiquetas: ['Nuevo'] },
    { id: 'c9', nombre: 'Mariano Gimenez', telefono: '+5491155551009', historialCompras: [], notasPersonales: 'Deuda importante. Saldra en 3 cuotas. Confiable.', saldoDeudor: 180000, activo: true, etiquetas: ['Fiable', 'Cta cte'] },
    { id: 'c10', nombre: 'Florencia Acuna', telefono: '+5491155551010', historialCompras: [], notasPersonales: 'Cliente nueva. Pago siempre al dia.', saldoDeudor: 0, activo: true, etiquetas: ['Nuevo'] },
  ];

  const ventasSeed: Array<Omit<Venta, 'id' | 'montoPagado'>> = [
    { clienteId: 'c1', productoId: 'p1', cantidad: 1, fecha: diasAtras(10), tipoPago: 'Efectivo', estadoPago: 'Pagado', precioUnitario: 78000, costoUnitario: 45000, total: 78000 },
    { clienteId: 'c2', productoId: 'p6', cantidad: 2, fecha: diasAtras(15), tipoPago: 'Transferencia', estadoPago: 'Pagado', precioUnitario: 52000, costoUnitario: 28000, total: 104000 },
    { clienteId: 'c3', productoId: 'p3', cantidad: 1, fecha: diasAtras(20), tipoPago: 'Efectivo', estadoPago: 'Pagado', precioUnitario: 98000, costoUnitario: 58000, total: 98000 },
    { clienteId: 'c4', productoId: 'p9', cantidad: 1, fecha: diasAtras(30), tipoPago: 'Efectivo', estadoPago: 'Pagado', precioUnitario: 56000, costoUnitario: 30000, total: 56000 },
    { clienteId: 'c5', productoId: 'p2', cantidad: 1, fecha: diasAtras(45), tipoPago: 'Transferencia', estadoPago: 'Pagado', precioUnitario: 89000, costoUnitario: 52000, total: 89000 },
    { clienteId: 'c6', productoId: 'p7', cantidad: 1, fecha: diasAtras(60), tipoPago: 'Efectivo', estadoPago: 'Pagado', precioUnitario: 49000, costoUnitario: 26000, total: 49000 },
    { clienteId: 'c7', productoId: 'p4', cantidad: 1, fecha: diasAtras(95), tipoPago: 'CuentaCorriente', estadoPago: 'Pendiente', precioUnitario: 102000, costoUnitario: 61000, total: 102000 },
    { clienteId: 'c8', productoId: 'p10', cantidad: 1, fecha: diasAtras(125), tipoPago: 'Efectivo', estadoPago: 'Pagado', precioUnitario: 58000, costoUnitario: 32000, total: 58000 },
    { clienteId: 'c1', productoId: 'p11', cantidad: 1, fecha: diasAtras(140), tipoPago: 'Efectivo', estadoPago: 'Pagado', precioUnitario: 67000, costoUnitario: 38000, total: 67000 },
    { clienteId: 'c2', productoId: 'p12', cantidad: 1, fecha: diasAtras(160), tipoPago: 'Transferencia', estadoPago: 'Pagado', precioUnitario: 72000, costoUnitario: 42000, total: 72000 },
    { clienteId: 'c5', productoId: 'p13', cantidad: 1, fecha: diasAtras(180), tipoPago: 'Efectivo', estadoPago: 'Pagado', precioUnitario: 92000, costoUnitario: 54000, total: 92000 },
    { clienteId: 'c8', productoId: 'p15', cantidad: 2, fecha: diasAtras(5), tipoPago: 'Efectivo', estadoPago: 'Pagado', precioUnitario: 62000, costoUnitario: 35000, total: 124000 },
    { clienteId: 'c3', productoId: 'p5', cantidad: 1, fecha: diasAtras(2), tipoPago: 'CuentaCorriente', estadoPago: 'Pendiente', precioUnitario: 84000, costoUnitario: 49000, total: 84000 },
    { clienteId: 'c6', productoId: 'p14', cantidad: 1, fecha: diasAtras(7), tipoPago: 'Transferencia', estadoPago: 'Pagado', precioUnitario: 85000, costoUnitario: 48000, total: 85000 },
    { clienteId: 'c9', productoId: 'p13', cantidad: 1, fecha: diasAtras(50), tipoPago: 'CuentaCorriente', estadoPago: 'Pendiente', precioUnitario: 92000, costoUnitario: 54000, total: 92000 },
    { clienteId: 'c9', productoId: 'p4', cantidad: 1, fecha: diasAtras(35), tipoPago: 'CuentaCorriente', estadoPago: 'Parcial', precioUnitario: 102000, costoUnitario: 61000, total: 102000 },
    { clienteId: 'c9', productoId: 'p8', cantidad: 1, fecha: diasAtras(20), tipoPago: 'CuentaCorriente', estadoPago: 'Pendiente', precioUnitario: 46000, costoUnitario: 24000, total: 46000 },
    { clienteId: 'c10', productoId: 'p6', cantidad: 1, fecha: diasAtras(8), tipoPago: 'Efectivo', estadoPago: 'Pagado', precioUnitario: 52000, costoUnitario: 28000, total: 52000 },
  ];

  const ventas: Venta[] = ventasSeed.map((v, i) => ({
    ...v,
    id: `v${i + 1}`,
    montoPagado: v.estadoPago === 'Pagado' ? v.total : v.estadoPago === 'Parcial' ? 20000 : 0,
  }));

  ventas.forEach((v) => {
    const cli = clientes.find((c) => c.id === v.clienteId);
    if (cli) cli.historialCompras.push(v.id);
  });

  const pagos: Pago[] = [
    {
      id: 'pg1',
      clienteId: 'c9',
      monto: 60000,
      fecha: diasAtras(15),
      nota: 'A cuenta de Le Male y primera cuota de Coco Mademoiselle',
      ventasAfectadas: [{ ventaId: 'v16', montoAplicado: 60000 }],
    },
    {
      id: 'pg2',
      clienteId: 'c9',
      monto: 20000,
      fecha: diasAtras(3),
      nota: 'Segundo pago parcial',
      ventasAfectadas: [{ ventaId: 'v16', montoAplicado: 20000 }],
    },
  ];

  guardarDB({ perfumes, clientes, ventas, pagos });
  console.log(`[seed] Insertados ${perfumes.length} perfumes, ${clientes.length} clientes, ${ventas.length} ventas, ${pagos.length} pagos.`);
};