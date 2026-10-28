import { PermisoEstructuraResponse } from '../../models/permisos';
import { permisosEditor } from './permisos-editor';

const FILAS: PermisoEstructuraResponse[] = [
  {
    rolAcceso: 'ADMINISTRADOR',
    crearPool: true,
    editarPool: false,
    eliminarPool: true,
    crearLane: false,
    editarLane: true,
    eliminarLane: true,
  },
  {
    rolAcceso: 'EDITOR',
    crearPool: true,
    editarPool: true,
    eliminarPool: true,
    crearLane: true,
    editarLane: true,
    eliminarLane: true,
  },
];

describe('permisosEditor', () => {
  it('el administrador usa su fila de permisos', () => {
    const p = permisosEditor('ADMINISTRADOR', FILAS, false);
    expect(p.editarPool).toBe(false);
    expect(p.crearLane).toBe(false);
    expect(p.eliminarPool).toBe(true);
  });

  it('el administrador tiene todo mientras no hay filas', () => {
    const p = permisosEditor('ADMINISTRADOR', null, false);
    expect(Object.values(p).every(Boolean)).toBe(true);
  });

  it('el editor usa los valores por defecto aunque la fila diga otra cosa', () => {
    const p = permisosEditor('EDITOR', FILAS, false);
    expect(p).toMatchObject({
      crearPool: true,
      editarPool: true,
      crearLane: true,
      editarLane: true,
      eliminarPool: false,
      eliminarLane: false,
    });
  });

  it('solo lectura no puede nada', () => {
    const p = permisosEditor('SOLO_LECTURA', FILAS, false);
    expect(Object.values(p).some(Boolean)).toBe(false);
  });

  it('un diagrama de solo lectura apaga todo, incluso para el administrador', () => {
    const p = permisosEditor('ADMINISTRADOR', FILAS, true);
    expect(Object.values(p).some(Boolean)).toBe(false);
  });
});
