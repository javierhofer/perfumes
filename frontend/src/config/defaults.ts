import type { Configuracion } from '../types/domain';

export const CONFIG_DEFAULT: Configuracion = {
  umbralStockCritico: 3,
  umbralDeudaCritica: 100000,
  diasRecompra: 120,
  datosNegocio: {
    nombre: 'Perfumes Manager',
    telefono: '',
    email: '',
    direccion: '',
    cuit: '',
  },
  etiquetasPersonalizadas: [
    { nombre: 'VIP', color: 'brand' },
    { nombre: 'Frecuente', color: 'emerald' },
    { nombre: 'Fiable', color: 'sky' },
    { nombre: 'Nuevo', color: 'violet' },
    { nombre: 'Cta cte', color: 'amber' },
    { nombre: 'Solo efectivo', color: 'slate' },
    { nombre: 'Solo transferencia', color: 'blue' },
    { nombre: 'Cumpleanos pronto', color: 'rose' },
  ],
  plantillaTelegram:
    'Hola {nombre}! Te escribo de tu perfumeria de confianza. Hace {dias} dias que no renovas tu {perfume}. Tengo stock disponible, queres que te reserve uno?',
  moneda: 'ARS',
  simboloMoneda: '$',
  temaVisual: 'claro',
  idioma: 'es',
  notificacionesActivas: false,
  numeracionTickets: {
    prefijo: 'V-',
    siguiente: 1,
  },
};