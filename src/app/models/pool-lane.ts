// Pools y lanes del diagrama.
import { TipoParticipante } from './enums';

export interface PoolRequest {
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra?: boolean;
}

export interface EditarPoolRequest {
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra?: boolean | null;
}

export interface PoolResponse {
  id: number;
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra: boolean;
  orden: number;
  procesoId: number;
}

export interface LaneRequest {
  nombre: string;
  rolProcesoId: number;
}

export interface ReordenarLanesRequest {
  laneIds: number[];
}

export interface LaneResponse {
  id: number;
  nombre: string;
  orden: number;
  poolId: number;
  rolProcesoId: number;
  rolProcesoNombre: string;
}
