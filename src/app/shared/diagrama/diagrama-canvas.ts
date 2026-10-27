// Lienzo SVG del diagrama: dibuja el árbol de pools, lanes, arcos y nodos y avisa qué elemento se elige.
import { Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import { ArcoView } from './arco-view';
import { NodoDiagrama, PoolArbol, Seleccion, tipoNodo } from './diagrama-arbol';
import { calcularLayout } from './diagrama-layout';
import { LaneView } from './lane-view';
import { NodoView } from './nodo-view';
import { PoolView } from './pool-view';

@Component({
  selector: 'app-diagrama-canvas',
  imports: [PoolView, LaneView, NodoView, ArcoView],
  styleUrl: './diagrama-canvas.css',
  templateUrl: './diagrama-canvas.html',
  encapsulation: ViewEncapsulation.None,
})
export class DiagramaCanvas {
  readonly arbol = input.required<PoolArbol[]>();
  readonly seleccion = input<Seleccion>(null);
  readonly seleccionar = output<Seleccion>();

  protected readonly vista = computed(() => {
    const arbol = this.arbol();
    const layout = calcularLayout(arbol);
    const pools = arbol.flatMap(({ pool, lanes }) => {
      const caja = layout.pools.get(pool.id);
      return caja ? [{ pool, caja, sinLanes: lanes.length === 0 }] : [];
    });
    const lanes = arbol.flatMap((p) =>
      p.lanes.flatMap(({ lane }) => {
        const caja = layout.lanes.get(lane.id);
        return caja ? [{ lane, caja }] : [];
      }),
    );
    const nodos = arbol.flatMap((p) =>
      p.lanes.flatMap((l) =>
        l.nodos.flatMap((nodo) => {
          const caja = layout.nodos.get(nodo.id);
          return caja ? [{ nodo, caja }] : [];
        }),
      ),
    );
    const arcos = arbol.flatMap((p) =>
      p.arcos.flatMap((arco) => {
        const desde = layout.nodos.get(arco.origenId);
        const hasta = layout.nodos.get(arco.destinoId);
        return desde && hasta ? [{ arco, desde, hasta }] : [];
      }),
    );
    return { ancho: layout.ancho, alto: layout.alto, pools, lanes, nodos, arcos };
  });

  protected esSeleccion(tipo: NonNullable<Seleccion>['tipo'], id: number): boolean {
    const s = this.seleccion();
    return s !== null && s.tipo === tipo && s.id === id;
  }

  protected etiquetaNodo(nodo: NodoDiagrama): string {
    return `${tipoNodo(nodo)}: ${nodo.nombre}`;
  }
}
