// Etiqueta con el estado de un proceso (borrador o publicado).
import { Component, input } from '@angular/core';
import { ETIQUETAS_ESTADO_PROCESO, EstadoProceso } from '../../models/enums';

@Component({
  selector: 'app-estado-badge',
  styleUrl: './estado-badge.css',
  template: `<span class="badge" [class.publicado]="estado() === 'PUBLICADO'">{{
    etiquetas[estado()]
  }}</span>`,
})
export class EstadoBadge {
  readonly estado = input.required<EstadoProceso>();
  protected readonly etiquetas = ETIQUETAS_ESTADO_PROCESO;
}
