// Procesos, historial y diagrama completo.
import { EstadoProceso } from './enums';
import { ArcoResponse } from './arco';
import { MensajeResponse } from './mensaje';
import { ActividadResponse, EventoMensajeResponse, GatewayResponse } from './nodo';
import { LaneResponse, PoolResponse } from './pool-lane';

export interface ProcesoRequest {
  nombre: string;
  descripcion: string;
  categoria: string;
}

export interface CambiarEstadoProcesoRequest {
  estado: EstadoProceso;
}

export interface ProcesoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: EstadoProceso;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface HistorialCambioResponse {
  id: number;
  fechaCambio: string;
  descripcionCambio: string;
  autorNombre: string;
}

export interface ProcesoDetalleResponse {
  proceso: ProcesoResponse;
  historial: HistorialCambioResponse[];
}

export interface DiagramaBase {
  proceso: ProcesoResponse;
  pools: PoolResponse[];
  lanes: LaneResponse[];
  actividades: ActividadResponse[];
  gateways: GatewayResponse[];
  eventos: EventoMensajeResponse[];
  arcos: ArcoResponse[];
  mensajes: MensajeResponse[];
}

export type ProcesoDiagramaResponse = DiagramaBase;
