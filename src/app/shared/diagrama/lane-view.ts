// Lane del diagrama: franja con su nombre y el rol de proceso que representa.
import { Component, input } from '@angular/core';
import { LaneResponse } from '../../models/pool-lane';
import { Caja } from './diagrama-layout';
import { Seleccionable } from './seleccionable';

@Component({
  selector: 'g[appLaneView]',
  hostDirectives: [
    { directive: Seleccionable, inputs: ['seleccionado', 'etiqueta'], outputs: ['elegir'] },
  ],
  template: `
    <svg:rect
      class="dg-forma dg-lane"
      [attr.x]="caja().x"
      [attr.y]="caja().y"
      [attr.width]="caja().ancho"
      [attr.height]="caja().alto"
    />
    <svg:text class="dg-nota" [attr.x]="caja().x + 8" [attr.y]="caja().y + 18">
      Lane: {{ lane().nombre }} · {{ lane().rolProcesoNombre }}
    </svg:text>
  `,
})
export class LaneView {
  readonly lane = input.required<LaneResponse>();
  readonly caja = input.required<Caja>();
}
