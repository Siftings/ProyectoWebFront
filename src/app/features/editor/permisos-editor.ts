// Permisos de estructura que se aplican en el editor según el rol (contrato 2.5, 2.6 y 2.7).
import { RolAcceso } from '../../models/enums';
import { PermisoEstructuraRequest, PermisoEstructuraResponse } from '../../models/permisos';

const TODO: PermisoEstructuraRequest = {
  crearPool: true,
  editarPool: true,
  eliminarPool: true,
  crearLane: true,
  editarLane: true,
  eliminarLane: true,
};

const NADA: PermisoEstructuraRequest = {
  crearPool: false,
  editarPool: false,
  eliminarPool: false,
  crearLane: false,
  editarLane: false,
  eliminarLane: false,
};

const EDITOR: PermisoEstructuraRequest = { ...TODO, eliminarPool: false, eliminarLane: false };

export function permisosEditor(
  rol: RolAcceso,
  filas: readonly PermisoEstructuraResponse[] | null,
  soloLectura: boolean,
): PermisoEstructuraRequest {
  if (soloLectura || rol === 'SOLO_LECTURA') {
    return NADA;
  }
  if (rol === 'EDITOR') {
    return EDITOR;
  }
  const fila = filas?.find((f) => f.rolAcceso === 'ADMINISTRADOR');
  return fila
    ? {
        crearPool: fila.crearPool,
        editarPool: fila.editarPool,
        eliminarPool: fila.eliminarPool,
        crearLane: fila.crearLane,
        editarLane: fila.editarLane,
        eliminarLane: fila.eliminarLane,
      }
    : TODO;
}
