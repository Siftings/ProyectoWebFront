// Enums del contrato como uniones de strings, con las etiquetas de UI de los que las necesitan.
export type RolAcceso = 'ADMINISTRADOR' | 'EDITOR' | 'SOLO_LECTURA';

export type EstadoProceso = 'BORRADOR' | 'PUBLICADO';

export type TipoParticipante = 'EMPRESA' | 'CLIENTE' | 'PROVEEDOR' | 'SISTEMA_EXTERNO';

export type TipoActividad = 'TAREA' | 'USUARIO' | 'SERVICIO' | 'MANUAL' | 'SCRIPT' | 'REGLA_NEGOCIO';

export type TipoGateway = 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO';

export type TipoEventoMensaje = 'THROW' | 'CATCH_INICIO' | 'CATCH_INTERMEDIO';

export type TipoDestinoExterno = 'CORREO' | 'SERVICIO_WEB' | 'COLA';

export type PoliticaFalloNotificacion = 'CONTINUAR_FLUJO' | 'DERIVAR_ACTIVIDAD_ERROR' | 'FINALIZAR_PROCESO';

export type PoliticaMensajeSinCaso = 'DESCARTAR' | 'INICIAR_CASO_NUEVO';

export const ETIQUETAS_TIPO_ACTIVIDAD: Record<TipoActividad, string> = {
  TAREA: 'Tarea',
  USUARIO: 'Tarea de usuario',
  SERVICIO: 'Tarea de servicio',
  MANUAL: 'Tarea manual',
  SCRIPT: 'Script',
  REGLA_NEGOCIO: 'Regla de negocio',
};

export const ETIQUETAS_TIPO_GATEWAY: Record<TipoGateway, string> = {
  EXCLUSIVO: 'Exclusivo (XOR)',
  PARALELO: 'Paralelo (AND)',
  INCLUSIVO: 'Inclusivo (OR)',
};

export const ETIQUETAS_TIPO_EVENTO: Record<TipoEventoMensaje, string> = {
  THROW: 'Envío de mensaje',
  CATCH_INICIO: 'Inicio por mensaje',
  CATCH_INTERMEDIO: 'Recepción intermedia',
};
