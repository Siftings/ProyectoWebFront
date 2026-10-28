// Lienzo SVG del diagrama: dibuja el árbol de pools, lanes, arcos y nodos y avisa qué elemento se elige.
import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ArcoResponse } from '../../models/arco';
import { ArcoView } from './arco-view';
import { MovimientoNodo, posicionArrastrada } from './arrastre';
import { NodoDiagrama, PoolArbol, Seleccion, tipoNodo } from './diagrama-arbol';
import { Punto, calcularLayout } from './diagrama-layout';
import { LaneView } from './lane-view';
import { NodoView } from './nodo-view';
import { PoolView } from './pool-view';

interface Arrastre {
  id: number;
  inicio: Punto;
  posicion: Punto;
  delta: Punto;
}

const UMBRAL_ARRASTRE = 3;

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
  readonly arrastrable = input(false);
  readonly seleccionar = output<Seleccion>();
  readonly mover = output<MovimientoNodo>();

  private readonly documento = inject(DOCUMENT);
  private readonly arrastre = signal<Arrastre | null>(null);
  private readonly alMover = (evento: PointerEvent) => this.arrastrar(evento);
  private readonly alSoltar = () => this.soltar();
  private readonly alCancelar = () => this.cancelarArrastre();

  constructor() {
    effect(() => {
      this.arbol();
      untracked(() => this.arrastre.set(null));
    });
    inject(DestroyRef).onDestroy(() => this.escuchar(false));
  }

  protected readonly vista = computed(() => {
    const arbol = this.arbol();
    const layout = calcularLayout(arbol);
    const a = this.arrastre();
    const caja = a ? layout.nodos.get(a.id) : undefined;
    if (a && caja) {
      const destino = posicionArrastrada(a.posicion, a.delta);
      layout.nodos.set(a.id, {
        ...caja,
        x: caja.x + destino.x - a.posicion.x,
        y: caja.y + destino.y - a.posicion.y,
      });
    }
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

  private readonly nombres = computed(
    () =>
      new Map(
        this.arbol().flatMap((p) => p.lanes.flatMap((l) => l.nodos.map((n) => [n.id, n.nombre]))),
      ),
  );

  protected esSeleccion(tipo: NonNullable<Seleccion>['tipo'], id: number): boolean {
    const s = this.seleccion();
    return s !== null && s.tipo === tipo && s.id === id;
  }

  protected etiquetaNodo(nodo: NodoDiagrama): string {
    return `${tipoNodo(nodo)}: ${nodo.nombre}`;
  }

  protected etiquetaArco(arco: ArcoResponse): string {
    const nombres = this.nombres();
    return `Arco de ${nombres.get(arco.origenId) ?? arco.origenId} a ${nombres.get(arco.destinoId) ?? arco.destinoId}`;
  }

  protected iniciarArrastre(evento: PointerEvent, nodo: NodoDiagrama): void {
    if (!this.arrastrable() || evento.button !== 0) {
      return;
    }
    this.arrastre.set({
      id: nodo.id,
      inicio: { x: evento.clientX, y: evento.clientY },
      posicion: { x: nodo.posicionX, y: nodo.posicionY },
      delta: { x: 0, y: 0 },
    });
    this.escuchar(true);
  }

  private arrastrar(evento: PointerEvent): void {
    const a = this.arrastre();
    if (a) {
      this.arrastre.set({
        ...a,
        delta: { x: evento.clientX - a.inicio.x, y: evento.clientY - a.inicio.y },
      });
    }
  }

  private soltar(): void {
    this.escuchar(false);
    const a = this.arrastre();
    if (!a) {
      return;
    }
    if (Math.hypot(a.delta.x, a.delta.y) < UMBRAL_ARRASTRE) {
      this.arrastre.set(null);
      return;
    }
    const destino = posicionArrastrada(a.posicion, a.delta);
    this.mover.emit({ id: a.id, posicionX: destino.x, posicionY: destino.y });
  }

  private cancelarArrastre(): void {
    this.escuchar(false);
    this.arrastre.set(null);
  }

  private escuchar(activo: boolean): void {
    if (activo) {
      this.documento.addEventListener('pointermove', this.alMover);
      this.documento.addEventListener('pointerup', this.alSoltar);
      this.documento.addEventListener('pointercancel', this.alCancelar);
    } else {
      this.documento.removeEventListener('pointermove', this.alMover);
      this.documento.removeEventListener('pointerup', this.alSoltar);
      this.documento.removeEventListener('pointercancel', this.alCancelar);
    }
  }
}
