// Mensaje entre pools: línea discontinua con flecha de un evento de envío a uno de recepción, con su nombre al medio.
import { Component, computed, input } from '@angular/core';
import { MensajeResponse } from '../../models/mensaje';
import { Caja, puntoBorde } from './diagrama-layout';
import { Seleccionable } from './seleccionable';

@Component({
  selector: 'g[appMensajeView]',
  hostDirectives: [
    { directive: Seleccionable, inputs: ['seleccionado', 'etiqueta'], outputs: ['elegir'] },
  ],
  template: `
    <svg:line
      class="dg-arco-area"
      [attr.x1]="linea().desde.x"
      [attr.y1]="linea().desde.y"
      [attr.x2]="linea().hasta.x"
      [attr.y2]="linea().hasta.y"
    />
    <svg:line
      class="dg-forma dg-arco dg-mensaje"
      marker-end="url(#dg-flecha)"
      [attr.x1]="linea().desde.x"
      [attr.y1]="linea().desde.y"
      [attr.x2]="linea().hasta.x"
      [attr.y2]="linea().hasta.y"
    />
    <svg:text
      class="dg-etiqueta"
      text-anchor="middle"
      [attr.x]="(linea().desde.x + linea().hasta.x) / 2"
      [attr.y]="(linea().desde.y + linea().hasta.y) / 2 - 6"
    >
      {{ mensaje().nombre }}
    </svg:text>
  `,
})
export class MensajeView {
  readonly mensaje = input.required<MensajeResponse>();
  readonly desde = input.required<Caja>();
  readonly hasta = input.required<Caja>();

  protected readonly linea = computed(() => {
    const a = this.desde();
    const b = this.hasta();
    const centroA = { x: a.x + a.ancho / 2, y: a.y + a.alto / 2 };
    const centroB = { x: b.x + b.ancho / 2, y: b.y + b.alto / 2 };
    return { desde: puntoBorde(a, centroB), hasta: puntoBorde(b, centroA) };
  });
}
