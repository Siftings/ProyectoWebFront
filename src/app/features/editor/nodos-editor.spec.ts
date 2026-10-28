import { NodoDiagrama } from '../../shared/diagrama/diagrama-arbol';
import { posicionNueva, requestPosicion } from './nodos-editor';

const ACTIVIDAD: NodoDiagrama = {
  kind: 'actividad',
  id: 1,
  nombre: 'Revisar',
  descripcion: 'Revisa la solicitud',
  posicionX: 100,
  posicionY: 20,
  laneId: 7,
  tipoActividad: 'USUARIO',
};

const GATEWAY: NodoDiagrama = {
  kind: 'gateway',
  id: 2,
  nombre: 'Decide',
  tipoGateway: 'EXCLUSIVO',
  posicionX: 300,
  posicionY: 20,
  laneId: 7,
};

const EVENTO: NodoDiagrama = {
  kind: 'evento',
  id: 3,
  nombre: 'Aviso',
  tipoEvento: 'THROW',
  contenido: 'hola',
  claveCorrelacion: 'k1',
  posicionX: 400,
  posicionY: 20,
  laneId: 7,
  origenExterno: true,
};

describe('requestPosicion', () => {
  it('actividad: conserva la descripción y el tipo', () => {
    expect(requestPosicion(ACTIVIDAD, 5, 6)).toEqual({
      kind: 'actividad',
      req: {
        nombre: 'Revisar',
        descripcion: 'Revisa la solicitud',
        tipoActividad: 'USUARIO',
        posicionX: 5,
        posicionY: 6,
      },
    });
  });

  it('actividad sin descripción no la manda', () => {
    const peticion = requestPosicion({ ...ACTIVIDAD, descripcion: null }, 5, 6);
    expect(peticion.kind === 'actividad' && peticion.req.descripcion).toBeUndefined();
  });

  it('gateway: manda nombre y tipo', () => {
    expect(requestPosicion(GATEWAY, 1, 2)).toEqual({
      kind: 'gateway',
      req: { nombre: 'Decide', tipoGateway: 'EXCLUSIVO', posicionX: 1, posicionY: 2 },
    });
  });

  it('evento: conserva contenido, clave y origen externo', () => {
    expect(requestPosicion(EVENTO, 1, 2)).toEqual({
      kind: 'evento',
      req: {
        nombre: 'Aviso',
        tipoEvento: 'THROW',
        contenido: 'hola',
        claveCorrelacion: 'k1',
        origenExterno: true,
        posicionX: 1,
        posicionY: 2,
      },
    });
  });
});

describe('posicionNueva', () => {
  it('lane vacía: esquina de partida', () => {
    expect(posicionNueva([])).toEqual({ x: 40, y: 40 });
  });

  it('va a la derecha del nodo más lejano', () => {
    // evento en x=400 (ancho 36) -> 400 + 36 + 40
    expect(posicionNueva([ACTIVIDAD, GATEWAY, EVENTO])).toEqual({ x: 476, y: 40 });
  });
});
