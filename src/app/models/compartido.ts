// Procesos compartidos entre empresas (siempre de solo lectura).
import { DiagramaBase } from './proceso';

export interface CompartirProcesoRequest {
  empresaInvitadaId: number;
}

export interface ProcesoCompartidoResponse {
  id: number;
  procesoId: number;
  procesoNombre: string;
  empresaPropietariaId: number;
  empresaPropietaria: string;
  empresaInvitadaId: number;
  empresaInvitada: string;
  soloLectura: boolean;
}

export interface ProcesoCompartidoDetalleResponse extends DiagramaBase {
  empresaPropietaria: string;
  soloLectura: true;
}
