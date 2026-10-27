// Nodo del diagrama: actividad (rectángulo), gateway (rombo con símbolo) o evento de mensaje (círculo).
import { Component, computed, input } from '@angular/core';
import { NodoDiagrama } from './diagrama-arbol';
import { Caja } from './diagrama-layout';
import { Seleccionable } from './seleccionable';

const SIMBOLO_GATEWAY = { EXCLUSIVO: 'X', PARALELO: '+', INCLUSIVO: 'O' } as const;

@Component({
  selector: 'g[appNodoView]',
  hostDirectives: [
    { directive: Seleccionable, inputs: ['seleccionado', 'etiqueta'], outputs: ['elegir'] },
  ],
  template: `
    <svg:title>{{ nodo().nombre }}</svg:title>
    @switch (nodo().kind) {
      @case ('actividad') {
        <svg:rect
          class="dg-forma dg-nodo"
          rx="8"
          [attr.x]="caja().x"
          [attr.y]="caja().y"
          [attr.width]="caja().ancho"
          [attr.height]="caja().alto"
        />
        <svg:text class="dg-centrado" [attr.x]="centro().x" [attr.y]="centro().y">
          {{ rotulo() }}
        </svg:text>
      }
      @case ('gateway') {
        <svg:polygon class="dg-forma dg-nodo" [attr.points]="rombo()" />
        <svg:text class="dg-centrado dg-simbolo" [attr.x]="centro().x" [attr.y]="centro().y">
          {{ simbolo() }}
        </svg:text>
        <svg:text class="dg-centrado" [attr.x]="centro().x" [attr.y]="caja().y + caja().alto + 14">
          {{ rotulo() }}
        </svg:text>
      }
      @case ('evento') {
        <svg:circle
          class="dg-forma dg-nodo"
          [class.dg-throw]="tipoEvento() === 'THROW'"
          [attr.cx]="centro().x"
          [attr.cy]="centro().y"
          [attr.r]="caja().ancho / 2"
        />
        @if (tipoEvento() === 'CATCH_INTERMEDIO') {
          <svg:circle
            class="dg-interno"
            [attr.cx]="centro().x"
            [attr.cy]="centro().y"
            [attr.r]="caja().ancho / 2 - 4"
          />
        }
        <svg:text class="dg-centrado" [attr.x]="centro().x" [attr.y]="caja().y + caja().alto + 14">
          {{ rotulo() }}
        </svg:text>
      }
    }
  `,
})
export class NodoView {
  readonly nodo = input.required<NodoDiagrama>();
  readonly caja = input.required<Caja>();

  protected readonly centro = computed(() => ({
    x: this.caja().x + this.caja().ancho / 2,
    y: this.caja().y + this.caja().alto / 2,
  }));

  protected readonly rombo = computed(() => {
    const { x, y, ancho, alto } = this.caja();
    return `${x + ancho / 2},${y} ${x + ancho},${y + alto / 2} ${x + ancho / 2},${y + alto} ${x},${y + alto / 2}`;
  });

  protected readonly rotulo = computed(() => {
    const n = this.nodo();
    const max = n.kind === 'actividad' ? 18 : 24;
    return n.nombre.length > max ? `${n.nombre.slice(0, max - 1)}…` : n.nombre;
  });

  protected readonly simbolo = computed(() => {
    const n = this.nodo();
    return n.kind === 'gateway' ? SIMBOLO_GATEWAY[n.tipoGateway] : '';
  });

  protected readonly tipoEvento = computed(() => {
    const n = this.nodo();
    return n.kind === 'evento' ? n.tipoEvento : null;
  });
}
