import { ArcoResponse } from '../../models/arco';
import { NodoDiagrama, PoolArbol } from '../../shared/diagrama/diagrama-arbol';
import {
  destinosPosibles,
  requestCrearArco,
  requestEditarArco,
  requiereCondicion,
} from './arcos-editor';

const actividad = (id: number, laneId = 10): NodoDiagrama => ({
  kind: 'actividad',
  id,
  nombre: `A${id}`,
  descripcion: null,
  posicionX: 0,
  posicionY: 0,
  laneId,
  tipoActividad: 'TAREA',
});

const gateway = (
  id: number,
  tipoGateway: 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO',
): NodoDiagrama => ({
  kind: 'gateway',
  id,
  nombre: `G${id}`,
  tipoGateway,
  posicionX: 0,
  posicionY: 0,
  laneId: 10,
});

const evento = (
  id: number,
  tipoEvento: 'THROW' | 'CATCH_INICIO' | 'CATCH_INTERMEDIO',
): NodoDiagrama => ({
  kind: 'evento',
  id,
  nombre: `E${id}`,
  tipoEvento,
  contenido: 'x',
  claveCorrelacion: 'k',
  posicionX: 0,
  posicionY: 0,
  laneId: 10,
  origenExterno: false,
});

const arco = (id: number, origenId: number, destinoId: number, poolId = 1): ArcoResponse => ({
  id,
  etiqueta: null,
  condicion: null,
  origenId,
  destinoId,
  poolId,
});

function pool(id: number, nodos: NodoDiagrama[], arcos: ArcoResponse[] = []): PoolArbol {
  return {
    pool: { id } as PoolArbol['pool'],
    lanes: [{ lane: { id: 10 + id } as PoolArbol['lanes'][number]['lane'], nodos }],
    arcos,
  };
}

describe('requiereCondicion', () => {
  it('es cierto para gateway exclusivo e inclusivo', () => {
    expect(requiereCondicion(gateway(1, 'EXCLUSIVO'))).toBe(true);
    expect(requiereCondicion(gateway(1, 'INCLUSIVO'))).toBe(true);
  });

  it('es falso para gateway paralelo, actividad y evento', () => {
    expect(requiereCondicion(gateway(1, 'PARALELO'))).toBe(false);
    expect(requiereCondicion(actividad(1))).toBe(false);
    expect(requiereCondicion(evento(1, 'THROW'))).toBe(false);
  });
});

describe('destinosPosibles', () => {
  it('excluye el origen, el inicio por mensaje y los ya conectados', () => {
    const arbol = [
      pool(
        1,
        [actividad(1), actividad(2), actividad(3), evento(4, 'CATCH_INICIO'), evento(5, 'THROW')],
        [arco(1, 1, 2)],
      ),
    ];
    expect(destinosPosibles(arbol, 1).map((n) => n.id)).toEqual([3, 5]);
  });

  it('un arco que entra al origen no lo quita de los destinos de otro nodo', () => {
    const arbol = [pool(1, [actividad(1), actividad(2)], [arco(1, 1, 2)])];
    expect(destinosPosibles(arbol, 2).map((n) => n.id)).toEqual([1]);
  });

  it('no ofrece nodos de otro pool', () => {
    const arbol = [pool(1, [actividad(1), actividad(2)]), pool(2, [actividad(3)])];
    expect(destinosPosibles(arbol, 1).map((n) => n.id)).toEqual([2]);
  });

  it('devuelve vacío si el origen no existe', () => {
    expect(destinosPosibles([pool(1, [actividad(1)])], 99)).toEqual([]);
  });
});

describe('requestCrearArco', () => {
  it('omite etiqueta y condición vacías', () => {
    expect(requestCrearArco(1, 2, '  ', '')).toEqual({ origenId: 1, destinoId: 2 });
  });

  it('recorta los textos', () => {
    expect(requestCrearArco(1, 2, ' si ', ' x > 1 ')).toEqual({
      origenId: 1,
      destinoId: 2,
      etiqueta: 'si',
      condicion: 'x > 1',
    });
  });
});

describe('requestEditarArco', () => {
  it('manda cadena vacía para borrar y no manda extremos', () => {
    expect(requestEditarArco('', ' c ')).toEqual({ etiqueta: '', condicion: 'c' });
  });
});
