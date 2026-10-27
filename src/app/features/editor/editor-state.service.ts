// Estado del editor de un proceso: diagrama cargado, árbol, selección y si es de solo lectura.
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { detalleError } from '../../core/errors/problem-detail';
import { ProcesosService } from '../../core/services/procesos.service';
import { UsuarioActualService } from '../../core/services/usuario-actual.service';
import { ArcoResponse } from '../../models/arco';
import { ProcesoDiagramaResponse } from '../../models/proceso';
import { LaneResponse, PoolResponse } from '../../models/pool-lane';
import { NodoDiagrama, Seleccion, armarArbol } from '../../shared/diagrama/diagrama-arbol';

export type ElementoSeleccionado =
  | { tipo: 'pool'; pool: PoolResponse }
  | { tipo: 'lane'; lane: LaneResponse }
  | { tipo: 'nodo'; nodo: NodoDiagrama }
  | { tipo: 'arco'; arco: ArcoResponse; origen: string; destino: string };

@Injectable()
export class EditorStateService {
  private readonly procesos = inject(ProcesosService);
  private readonly usuario = inject(UsuarioActualService);

  readonly diagrama = signal<ProcesoDiagramaResponse | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly seleccion = signal<Seleccion>(null);

  readonly arbol = computed(() => {
    const d = this.diagrama();
    return d ? armarArbol(d) : [];
  });

  readonly motivoSoloLectura = computed(() => {
    if (this.diagrama()?.proceso.estado === 'PUBLICADO') {
      return 'El proceso está publicado: el diagrama no se puede modificar.';
    }
    return this.usuario.puedeEditar() ? null : 'Tu rol solo permite ver el diagrama.';
  });

  readonly soloLectura = computed(() => this.motivoSoloLectura() !== null);

  readonly seleccionado = computed<ElementoSeleccionado | null>(() => {
    const s = this.seleccion();
    if (s === null) {
      return null;
    }
    const arbol = this.arbol();
    const nodos = arbol.flatMap((p) => p.lanes.flatMap((l) => l.nodos));
    switch (s.tipo) {
      case 'pool': {
        const pool = arbol.find((p) => p.pool.id === s.id)?.pool;
        return pool ? { tipo: 'pool', pool } : null;
      }
      case 'lane': {
        const lane = arbol.flatMap((p) => p.lanes).find((l) => l.lane.id === s.id)?.lane;
        return lane ? { tipo: 'lane', lane } : null;
      }
      case 'nodo': {
        const nodo = nodos.find((n) => n.id === s.id);
        return nodo ? { tipo: 'nodo', nodo } : null;
      }
      case 'arco': {
        const arco = arbol.flatMap((p) => p.arcos).find((a) => a.id === s.id);
        if (!arco) {
          return null;
        }
        const nombre = (id: number) => nodos.find((n) => n.id === id)?.nombre ?? `#${id}`;
        return {
          tipo: 'arco',
          arco,
          origen: nombre(arco.origenId),
          destino: nombre(arco.destinoId),
        };
      }
    }
  });

  cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.seleccion.set(null);
    this.procesos
      .diagrama(id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (d) => this.diagrama.set(d),
        error: (err: unknown) => this.error.set(detalleError(err)),
      });
  }

  seleccionar(s: Seleccion): void {
    this.seleccion.set(s);
  }
}
