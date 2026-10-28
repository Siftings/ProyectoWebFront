// Estado del editor de un proceso: diagrama cargado, árbol, selección y si es de solo lectura.
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { detalleError } from '../../core/errors/problem-detail';
import { ArcosService } from '../../core/services/arcos.service';
import { LanesService } from '../../core/services/lanes.service';
import { PermisosEstructuraService } from '../../core/services/permisos-estructura.service';
import { KindNodo, NodosService } from '../../core/services/nodos.service';
import { PoolsService } from '../../core/services/pools.service';
import { ProcesosService } from '../../core/services/procesos.service';
import { UsuarioActualService } from '../../core/services/usuario-actual.service';
import { ArcoResponse } from '../../models/arco';
import { PermisoEstructuraResponse } from '../../models/permisos';
import { ProcesoDiagramaResponse } from '../../models/proceso';
import { LaneResponse, PoolResponse } from '../../models/pool-lane';
import { MovimientoNodo } from '../../shared/diagrama/arrastre';
import { NodoDiagrama, Seleccion, armarArbol } from '../../shared/diagrama/diagrama-arbol';
import { destinosPosibles } from './arcos-editor';
import { requestPosicion } from './nodos-editor';
import { moverLane as nuevoOrden } from './orden-lanes';
import { permisosEditor } from './permisos-editor';

export type ElementoSeleccionado =
  | { tipo: 'pool'; pool: PoolResponse }
  | { tipo: 'lane'; lane: LaneResponse }
  | { tipo: 'nodo'; nodo: NodoDiagrama }
  | {
      tipo: 'arco';
      arco: ArcoResponse;
      origen: string;
      destino: string;
      origenNodo: NodoDiagrama | undefined;
    };

export type Creando =
  | { tipo: 'pool' }
  | { tipo: 'lane'; poolId: number }
  | { tipo: 'nodo'; kind: KindNodo; laneId: number }
  | { tipo: 'arco'; origenId: number; destinoId: number | null }
  | null;

@Injectable()
export class EditorStateService {
  private readonly procesos = inject(ProcesosService);
  private readonly pools = inject(PoolsService);
  private readonly lanes = inject(LanesService);
  private readonly nodos = inject(NodosService);
  private readonly arcos = inject(ArcosService);
  private readonly permisosApi = inject(PermisosEstructuraService);
  private readonly usuario = inject(UsuarioActualService);
  private readonly peticiones = new Subject<{ id: number; limpiar: boolean }>();

  readonly diagrama = signal<ProcesoDiagramaResponse | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly seleccion = signal<Seleccion>(null);
  readonly creando = signal<Creando>(null);
  readonly errorAccion = signal<string | null>(null);
  private readonly ocupado = signal(false);
  readonly filasPermisos = signal<PermisoEstructuraResponse[] | null>(null);

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

  readonly permisos = computed(() =>
    permisosEditor(this.usuario.rol(), this.filasPermisos(), this.soloLectura()),
  );

  readonly puedeModelar = computed(() => !this.soloLectura());

  readonly puedeEliminarFlujo = computed(() => this.puedeModelar() && this.usuario.esAdmin());

  readonly altaArco = computed(() => {
    const c = this.creando();
    if (c?.tipo !== 'arco') {
      return null;
    }
    const arbol = this.arbol();
    const origen = arbol
      .flatMap((p) => p.lanes.flatMap((l) => l.nodos))
      .find((n) => n.id === c.origenId);
    return origen
      ? { origen, destinos: destinosPosibles(arbol, c.origenId), destinoId: c.destinoId }
      : null;
  });

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
          origenNodo: nodos.find((n) => n.id === arco.origenId),
        };
      }
    }
  });

  constructor() {
    this.peticiones
      .pipe(
        tap(({ limpiar }) => {
          this.cargando.set(true);
          this.error.set(null);
          if (limpiar) {
            this.seleccion.set(null);
          }
        }),
        switchMap(({ id }) =>
          this.procesos.diagrama(id).pipe(
            map((d) => ({ d, err: null as string | null })),
            catchError((err: unknown) => of({ d: null, err: detalleError(err) })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ d, err }) => {
        this.cargando.set(false);
        if (d) {
          this.diagrama.set(d);
        } else {
          this.error.set(err);
        }
      });

    if (this.usuario.esAdmin()) {
      this.permisosApi
        .listar()
        .subscribe({ next: (filas) => this.filasPermisos.set(filas), error: () => undefined });
    }
  }

  cargar(id: number): void {
    this.peticiones.next({ id, limpiar: true });
  }

  recargar(): void {
    const id = this.diagrama()?.proceso.id;
    if (id !== undefined) {
      this.peticiones.next({ id, limpiar: false });
    }
  }

  seleccionar(s: Seleccion): void {
    const c = this.creando();
    if (c?.tipo === 'arco' && s?.tipo === 'nodo') {
      if (this.altaArco()?.destinos.some((n) => n.id === s.id)) {
        this.creando.set({ ...c, destinoId: s.id });
        return;
      }
    }
    this.creando.set(null);
    this.errorAccion.set(null);
    this.seleccion.set(s);
  }

  nuevoPool(): void {
    this.errorAccion.set(null);
    this.seleccion.set(null);
    this.creando.set({ tipo: 'pool' });
  }

  nuevaLane(poolId: number): void {
    this.errorAccion.set(null);
    this.creando.set({ tipo: 'lane', poolId });
  }

  nuevoNodo(kind: KindNodo, laneId: number): void {
    this.errorAccion.set(null);
    this.creando.set({ tipo: 'nodo', kind, laneId });
  }

  nuevoArco(origenId: number): void {
    this.errorAccion.set(null);
    this.creando.set({ tipo: 'arco', origenId, destinoId: null });
  }

  cancelarCreacion(): void {
    this.creando.set(null);
  }

  guardado(seleccion: Seleccion): void {
    this.creando.set(null);
    this.errorAccion.set(null);
    this.seleccion.set(seleccion);
    this.recargar();
  }

  moverLane(laneId: number, delta: -1 | 1): void {
    const pool = this.arbol().find((p) => p.lanes.some((l) => l.lane.id === laneId));
    const ids = pool
      ? nuevoOrden(
          pool.lanes.map((l) => l.lane.id),
          laneId,
          delta,
        )
      : null;
    if (!pool || !ids || this.ocupado() || this.cargando()) {
      return;
    }
    this.errorAccion.set(null);
    this.ocupado.set(true);
    this.lanes
      .reordenar(pool.pool.id, ids)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () => this.recargar(),
        error: (err: unknown) => this.errorAccion.set(detalleError(err)),
      });
  }

  eliminar(tipo: 'pool' | 'lane', id: number): void {
    if (this.ocupado()) {
      return;
    }
    this.errorAccion.set(null);
    this.ocupado.set(true);
    const peticion = tipo === 'pool' ? this.pools.eliminar(id) : this.lanes.eliminar(id);
    peticion.pipe(finalize(() => this.ocupado.set(false))).subscribe({
      next: () => {
        this.seleccion.set(null);
        this.recargar();
      },
      error: (err: unknown) => this.errorAccion.set(detalleError(err)),
    });
  }

  moverNodo({ id, posicionX, posicionY }: MovimientoNodo): void {
    const nodo = this.arbol()
      .flatMap((p) => p.lanes.flatMap((l) => l.nodos))
      .find((n) => n.id === id);
    if (!nodo || this.ocupado()) {
      this.recargar();
      return;
    }
    const peticion = requestPosicion(nodo, posicionX, posicionY);
    this.errorAccion.set(null);
    this.ocupado.set(true);
    let guardar: Observable<unknown>;
    switch (peticion.kind) {
      case 'actividad':
        guardar = this.nodos.editar('actividad', id, peticion.req);
        break;
      case 'gateway':
        guardar = this.nodos.editar('gateway', id, peticion.req);
        break;
      case 'evento':
        guardar = this.nodos.editar('evento', id, peticion.req);
        break;
    }
    guardar.pipe(finalize(() => this.ocupado.set(false))).subscribe({
      next: () => this.recargar(),
      error: (err: unknown) => {
        this.errorAccion.set(detalleError(err));
        this.recargar();
      },
    });
  }

  advertenciasNodo(
    kind: 'actividad' | 'gateway',
    id: number,
    alResolver: (a: string[]) => void,
  ): void {
    if (this.ocupado()) {
      return;
    }
    this.errorAccion.set(null);
    this.ocupado.set(true);
    this.nodos
      .impacto(kind, id)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: (impacto) => alResolver(impacto.advertencias),
        error: (err: unknown) => this.errorAccion.set(detalleError(err)),
      });
  }

  eliminarNodo(kind: KindNodo, id: number): void {
    if (this.ocupado()) {
      return;
    }
    this.errorAccion.set(null);
    this.ocupado.set(true);
    this.nodos
      .eliminar(kind, id)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () => {
          this.seleccion.set(null);
          this.recargar();
        },
        error: (err: unknown) => this.errorAccion.set(detalleError(err)),
      });
  }

  advertenciasArco(id: number, alResolver: (a: string[]) => void): void {
    if (this.ocupado()) {
      return;
    }
    this.errorAccion.set(null);
    this.ocupado.set(true);
    this.arcos
      .impacto(id)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: (impacto) => alResolver(impacto.advertencias),
        error: (err: unknown) => this.errorAccion.set(detalleError(err)),
      });
  }

  eliminarArco(id: number): void {
    if (this.ocupado()) {
      return;
    }
    this.errorAccion.set(null);
    this.ocupado.set(true);
    this.arcos
      .eliminar(id)
      .pipe(finalize(() => this.ocupado.set(false)))
      .subscribe({
        next: () => {
          this.seleccion.set(null);
          this.recargar();
        },
        error: (err: unknown) => this.errorAccion.set(detalleError(err)),
      });
  }
}
