// Permisos de estructura (pools y lanes) por rol.
import { RolAcceso } from './enums';

export interface PermisoEstructuraRequest {
  crearPool: boolean;
  editarPool: boolean;
  eliminarPool: boolean;
  crearLane: boolean;
  editarLane: boolean;
  eliminarLane: boolean;
}

export interface PermisoEstructuraResponse extends PermisoEstructuraRequest {
  rolAcceso: RolAcceso;
}
