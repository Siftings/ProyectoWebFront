// Editor del diagrama de un proceso: lienzo SVG y panel con los datos del elemento elegido (solo lectura por ahora).
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ETIQUETAS_TIPO_PARTICIPANTE } from '../../models/enums';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { tipoNodo } from '../../shared/diagrama/diagrama-arbol';
import { DiagramaCanvas } from '../../shared/diagrama/diagrama-canvas';
import { EstadoBadge } from '../../shared/estado-badge/estado-badge';
import { EditorStateService } from './editor-state.service';

@Component({
  imports: [RouterLink, AlertaError, EstadoBadge, DiagramaCanvas],
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

  constructor() {
    if (!Number.isInteger(this.id)) {
      void this.router.navigate(['/procesos']);
      return;
    }
    this.estado.cargar(this.id);
  }
}
