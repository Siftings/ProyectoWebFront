// Nodos del diagrama: actividades, gateways y eventos de mensaje.
import { TipoActividad, TipoEventoMensaje, TipoGateway } from './enums';

export interface ActividadRequest {
  nombre: string;
  descripcion?: string;
  posicionX?: number;
  posicionY?: number;
  laneId?: number;
  tipoActividad?: TipoActividad;
}

export interface ActividadResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  posicionX: number;
  posicionY: number;
  laneId: number;
  tipoActividad: TipoActividad;
}

export interface GatewayRequest {
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX?: number;
  posicionY?: number;
}

export interface GatewayResponse {
  id: number;
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
  laneId: number;
}

export interface EventoMensajeRequest {
  nombre: string;
  tipoEvento: TipoEventoMensaje;
  contenido: string;
  claveCorrelacion: string;
  posicionX?: number;
  posicionY?: number;
  origenExterno?: boolean;
}

export interface EventoMensajeResponse {
  id: number;
  nombre: string;
  tipoEvento: TipoEventoMensaje;
  contenido: string;
  claveCorrelacion: string;
  posicionX: number;
  posicionY: number;
  laneId: number;
  origenExterno: boolean;
}
