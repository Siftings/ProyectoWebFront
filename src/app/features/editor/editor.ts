// Editor del diagrama de un proceso: lienzo SVG y panel para ver, crear, editar, reordenar y eliminar pools y lanes.
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ETIQUETAS_TIPO_PARTICIPANTE } from '../../models/enums';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { tipoNodo } from '../../shared/diagrama/diagrama-arbol';
import { DiagramaCanvas } from '../../shared/diagrama/diagrama-canvas';
import { EstadoBadge } from '../../shared/estado-badge/estado-badge';
import { EditorStateService } from './editor-state.service';
import { LaneFormulario } from './lane-formulario';
import { PoolFormulario } from './pool-formulario';

interface Pendiente {
  tipo: 'pool' | 'lane';
  id: number;
  nombre: string;
}

@Component({
  imports: [
    RouterLink,
    AlertaError,
    ConfirmDialog,
    EstadoBadge,
    DiagramaCanvas,
    PoolFormulario,
    LaneFormulario,
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
  protected readonly tipoNodo = tipoNodo;
  protected readonly pendiente = signal<Pendiente | null>(null);
  protected readonly textos = computed(() => {
    const p = this.pendiente();
    return p?.tipo === 'pool'
      ? {
          titulo: `Eliminar el pool "${p.nombre}"`,
          mensaje: 'También se eliminan sus lanes. Esta acción no se puede deshacer.',
        }
      : {
          titulo: `Eliminar la lane "${p?.nombre ?? ''}"`,
          mensaje: 'Esta acción no se puede deshacer.',
        };
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

  protected confirmarEliminar(): void {
    const p = this.pendiente();
    this.pendiente.set(null);
    if (p) {
      this.estado.eliminar(p.tipo, p.id);
    }
  }

  private lanesDelPool(laneId: number): number[] {
    const pool = this.estado.arbol().find((p) => p.lanes.some((l) => l.lane.id === laneId));
    return pool ? pool.lanes.map((l) => l.lane.id) : [];
  }
}
