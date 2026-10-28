import { MensajeResponse } from '../../models/mensaje';
import { NodoDiagrama, PoolArbol } from '../../shared/diagrama/diagrama-arbol';
import {
  NodoEvento,
  candidatosCatch,
  extremosMensaje,
  requestCrearMensaje,
  requestEditarMensaje,
} from './mensajes-editor';

const evento = (
  id: number,
  tipoEvento: 'THROW' | 'CATCH_INICIO' | 'CATCH_INTERMEDIO',
  nombre = 'Pedido',
  claveCorrelacion = 'idProceso',
): NodoEvento => ({
  kind: 'evento',
  id,
  nombre,
  tipoEvento,
  contenido: 'datos',
  claveCorrelacion,
  posicionX: 0,
  posicionY: 0,
  laneId: 0,
  origenExterno: false,
});

function pool(id: number, nodos: NodoDiagrama[]): PoolArbol {
  return {
    pool: { id } as PoolArbol['pool'],
    lanes: [{ lane: { id: 10 + id } as PoolArbol['lanes'][number]['lane'], nodos }],
    arcos: [],
  };
}

const mensaje = (eventoThrowId: number | null, eventoCatchId: number | null): MensajeResponse =>
  ({
    id: 1,
    nombre: 'Pedido',
    eventoThrowId,
    eventoCatchId,
  }) as MensajeResponse;

describe('candidatosCatch', () => {
  const emisor = evento(1, 'THROW');

  it('trae los CATCH de otro pool con el mismo nombre y clave, sin distinguir mayúsculas', () => {
    const arbol = [
      pool(1, [emisor]),
      pool(2, [evento(2, 'CATCH_INTERMEDIO', 'pedido', 'IDPROCESO'), evento(3, 'CATCH_INICIO')]),
    ];

    expect(candidatosCatch(arbol, [], emisor).map((n) => n.id)).toEqual([2, 3]);
  });

  it('excluye otro nombre, otra clave, THROW y CATCH del mismo pool', () => {
    const arbol = [
      pool(1, [emisor, evento(4, 'CATCH_INTERMEDIO')]),
      pool(2, [
        evento(2, 'CATCH_INTERMEDIO', 'Otro'),
        evento(3, 'CATCH_INTERMEDIO', 'Pedido', 'otra'),
        evento(5, 'THROW'),
      ]),
    ];

    expect(candidatosCatch(arbol, [], emisor)).toEqual([]);
  });

  it('excluye los CATCH que ya reciben un mensaje', () => {
    const arbol = [pool(1, [emisor]), pool(2, [evento(2, 'CATCH_INTERMEDIO')])];

    expect(candidatosCatch(arbol, [mensaje(9, 2)], emisor)).toEqual([]);
  });
});

describe('extremosMensaje', () => {
  const arbol = [pool(1, [evento(1, 'THROW')]), pool(2, [evento(2, 'CATCH_INTERMEDIO')])];

  it('devuelve el origen y el destino', () => {
    const extremos = extremosMensaje(mensaje(1, 2), arbol);

    expect(extremos?.origen.id).toBe(1);
    expect(extremos?.destino.id).toBe(2);
  });

  it('devuelve null si falta un extremo', () => {
    expect(extremosMensaje(mensaje(1, null), arbol)).toBeNull();
    expect(extremosMensaje(mensaje(1, 99), arbol)).toBeNull();
  });
});

describe('requestCrearMensaje', () => {
  it('toma nombre y clave del THROW, deriva los pools y recorta el contenido', () => {
    const emisor = evento(1, 'THROW', 'Pedido', 'k');
    const receptor = evento(2, 'CATCH_INTERMEDIO', 'Pedido', 'k');
    const arbol = [pool(5, [emisor]), pool(6, [receptor])];

    expect(requestCrearMensaje(arbol, emisor, receptor, '  datos  ', 'DESCARTAR')).toEqual({
      nombre: 'Pedido',
      contenido: 'datos',
      poolOrigenId: 5,
      poolDestinoId: 6,
      eventoThrowId: 1,
      eventoCatchId: 2,
      claveCorrelacion: 'k',
      politicaSinCaso: 'DESCARTAR',
    });
  });
});

describe('requestEditarMensaje', () => {
  it('manda el nombre actual, el contenido recortado y la política, sin lo demás', () => {
    expect(requestEditarMensaje(mensaje(1, 2), ' nuevo ', 'INICIAR_CASO_NUEVO')).toEqual({
      nombre: 'Pedido',
      contenido: 'nuevo',
      politicaSinCaso: 'INICIAR_CASO_NUEVO',
    });
  });
});
