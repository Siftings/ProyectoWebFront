// Mensajes entre pools y su correlación.
import { PoliticaFalloNotificacion, PoliticaMensajeSinCaso, TipoDestinoExterno } from './enums';

export interface MensajeRequest {
  nombre: string;
  contenido: string;
  poolOrigenId: number;
  poolDestinoId: number;
  eventoThrowId?: number;
  eventoCatchId?: number;
  claveCorrelacion?: string;
  tipoDestinoExterno?: TipoDestinoExterno;
  destinoExterno?: string;
  politicaFalloNotificacion?: PoliticaFalloNotificacion;
  actividadErrorId?: number;
  politicaSinCaso?: PoliticaMensajeSinCaso;
}

export interface EditarMensajeRequest {
  nombre: string;
  contenido: string;
  eventoCatchId?: number;
  claveCorrelacion?: string;
  tipoDestinoExterno?: TipoDestinoExterno;
  destinoExterno?: string;
  politicaFalloNotificacion?: PoliticaFalloNotificacion;
  actividadErrorId?: number;
  politicaSinCaso?: PoliticaMensajeSinCaso;
}

export interface MensajeResponse {
  id: number;
  nombre: string;
  contenido: string;
  poolOrigenId: number;
  poolDestinoId: number;
  procesoId: number;
  eventoThrowId: number | null;
  eventoCatchId: number | null;
  claveCorrelacion: string | null;
  tipoDestinoExterno: TipoDestinoExterno | null;
  destinoExterno: string | null;
  politicaFalloNotificacion: PoliticaFalloNotificacion | null;
  actividadErrorId: number | null;
  politicaSinCaso: PoliticaMensajeSinCaso;
  sinReceptor: boolean;
}

export interface CorrelacionRequest {
  criterio: string;
}

export interface CorrelacionResponse {
  id: number;
  criterio: string;
  mensajeId: number;
}
