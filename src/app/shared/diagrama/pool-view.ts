// Pool del diagrama: marco con su nombre encima y una nota si no tiene lanes.
import { Component, input } from '@angular/core';
import { PoolResponse } from '../../models/pool-lane';
import { Caja } from './diagrama-layout';
import { Seleccionable } from './seleccionable';

@Component({
  selector: 'g[appPoolView]',
  hostDirectives: [
    { directive: Seleccionable, inputs: ['seleccionado', 'etiqueta'], outputs: ['elegir'] },
  ],
  template: `
    <svg:rect
      class="dg-forma dg-pool"
      [attr.x]="caja().x"
      [attr.y]="caja().y"
      [attr.width]="caja().ancho"
      [attr.height]="caja().alto"
    />
    <svg:text class="dg-titulo" [attr.x]="caja().x" [attr.y]="caja().y - 6">
      Pool: {{ pool().nombre }}
    </svg:text>
    @if (sinLanes()) {
      <svg:text
        class="dg-nota"
        text-anchor="middle"
        [attr.x]="caja().x + caja().ancho / 2"
        [attr.y]="caja().y + caja().alto / 2"
      >
        {{ pool().cajaNegra ? 'Caja negra' : 'Sin lanes' }}
      </svg:text>
    }
  `,
})
export class PoolView {
  readonly pool = input.required<PoolResponse>();
  readonly caja = input.required<Caja>();
  readonly sinLanes = input(false);
}
