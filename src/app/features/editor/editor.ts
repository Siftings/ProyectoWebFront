// Editor del diagrama de un proceso: lienzo SVG y panel para ver, crear, editar, reordenar y eliminar pools y lanes.
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KindNodo } from '../../core/services/nodos.service';
import { ETIQUETAS_POLITICA_SIN_CASO, ETIQUETAS_TIPO_PARTICIPANTE } from '../../models/enums';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { NodoDiagrama, tipoNodo } from '../../shared/diagrama/diagrama-arbol';
import { DiagramaCanvas } from '../../shared/diagrama/diagrama-canvas';
import { Punto } from '../../shared/diagrama/diagrama-layout';
import { EstadoBadge } from '../../shared/estado-badge/estado-badge';
import { ActividadFormulario } from './actividad-formulario';
import { ArcoFormulario } from './arco-formulario';
import { CorrelacionPanel } from './correlacion-panel';
import { EditorStateService } from './editor-state.service';
import { EventoFormulario } from './evento-formulario';
import { GatewayFormulario } from './gateway-formulario';
import { LaneFormulario } from './lane-formulario';
import { MensajeFormulario } from './mensaje-formulario';
import { posicionNueva } from './nodos-editor';
import { PoolFormulario } from './pool-formulario';

type Pendiente =
  | { tipo: 'pool' | 'lane'; id: number; nombre: string }
  | { tipo: 'nodo'; id: number; nombre: string; kind: KindNodo; advertencias: string[] }
  | { tipo: 'arco'; id: number; nombre: string; advertencias: string[] }
  | { tipo: 'mensaje'; id: number; nombre: string };

@Component({
  imports: [
    RouterLink,
    AlertaError,
    ConfirmDialog,
    EstadoBadge,
    DiagramaCanvas,
    PoolFormulario,
    LaneFormulario,
    ActividadFormulario,
    ArcoFormulario,
    GatewayFormulario,
    EventoFormulario,
    MensajeFormulario,
    CorrelacionPanel,
  ],
  providers: [EditorStateService],
  selector: 'app-editor',
  styleUrl: './editor.css',
  templateUrl: './editor.html',
})
export class Editor {
  private readonly router = inject(Router);
  private readonly idParam = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly estado = inject(EditorStateService);
  protected readonly id = Number(this.idParam);
  protected readonly participante = ETIQUETAS_TIPO_PARTICIPANTE;
  protected readonly politicas = ETIQUETAS_POLITICA_SIN_CASO;
  protected readonly tipoNodo = tipoNodo;
  protected readonly pendiente = signal<Pendiente | null>(null);
  protected readonly advertencias = computed(() => {
    const p = this.pendiente();
    return p?.tipo === 'nodo' || p?.tipo === 'arco' ? p.advertencias : [];
  });
  protected readonly textos = computed(() => {
    const p = this.pendiente();
    switch (p?.tipo) {
      case 'pool':
        return {
          titulo: `Eliminar el pool "${p.nombre}"`,
          mensaje: 'También se eliminan sus lanes. Esta acción no se puede deshacer.',
        };
      case 'nodo':
        return {
          titulo: `Eliminar "${p.nombre}"`,
          mensaje: 'También se desactivan sus arcos. Esta acción no se puede deshacer.',
        };
      case 'arco':
        return {
          titulo: `Eliminar el arco ${p.nombre}`,
          mensaje: 'Esta acción no se puede deshacer.',
        };
      case 'mensaje':
        return {
          titulo: `Eliminar el mensaje "${p.nombre}"`,
          mensaje: 'También se elimina su correlación. Esta acción no se puede deshacer.',
        };
      default:
        return {
          titulo: `Eliminar la lane "${p?.nombre ?? ''}"`,
          mensaje: 'Esta acción no se puede deshacer.',
        };
    }
  });

  constructor() {
    if (!Number.isInteger(this.id)) {
      void this.router.navigate(['/procesos']);
      return;
    }
    this.estado.cargar(this.id);
  }

  protected esPrimera(laneId: number): boolean {
    return this.lanesDelPool(laneId)[0] === laneId;
  }

  protected esUltima(laneId: number): boolean {
    return this.lanesDelPool(laneId).at(-1) === laneId;
  }

  protected posicionAlta(laneId: number): Punto {
    const lane = this.estado
      .arbol()
      .flatMap((p) => p.lanes)
      .find((l) => l.lane.id === laneId);
    return posicionNueva(lane?.nodos ?? []);
  }

  protected pedirEliminarNodo(nodo: NodoDiagrama): void {
    const base = { tipo: 'nodo' as const, id: nodo.id, nombre: nodo.nombre };
    if (nodo.kind === 'evento') {
      this.pendiente.set({ ...base, kind: nodo.kind, advertencias: [] });
      return;
    }
    const kind = nodo.kind;
    this.estado.advertenciasNodo(kind, nodo.id, (advertencias) =>
      this.pendiente.set({ ...base, kind, advertencias }),
    );
  }

  protected pedirEliminarArco(id: number, origen: string, destino: string): void {
    this.estado.advertenciasArco(id, (advertencias) =>
      this.pendiente.set({ tipo: 'arco', id, nombre: `de ${origen} a ${destino}`, advertencias }),
    );
  }

  protected confirmarEliminar(): void {
    const p = this.pendiente();
    this.pendiente.set(null);
    if (!p) {
      return;
    }
    if (p.tipo === 'nodo') {
      this.estado.eliminarNodo(p.kind, p.id);
    } else if (p.tipo === 'arco') {
      this.estado.eliminarArco(p.id);
    } else if (p.tipo === 'mensaje') {
      this.estado.eliminarMensaje(p.id);
    } else {
      this.estado.eliminar(p.tipo, p.id);
    }
  }

  private lanesDelPool(laneId: number): number[] {
    const pool = this.estado.arbol().find((p) => p.lanes.some((l) => l.lane.id === laneId));
    return pool ? pool.lanes.map((l) => l.lane.id) : [];
  }
}
