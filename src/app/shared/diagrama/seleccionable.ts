// Hace de un elemento SVG un botón seleccionable con ratón y teclado. Lo usan las vistas del diagrama como host directive.
import { Directive, input, output } from '@angular/core';

@Directive({
  selector: '[appSeleccionable]',
  host: {
    class: 'dg-elemento',
    role: 'button',
    tabindex: '0',
    '[attr.aria-pressed]': 'seleccionado()',
    '[attr.aria-label]': 'etiqueta()',
    '[class.dg-seleccionado]': 'seleccionado()',
    '(click)': 'activar($event)',
    '(keydown.enter)': 'activar($event)',
    '(keydown.space)': 'activar($event)',
  },
})
export class Seleccionable {
  readonly seleccionado = input(false);
  readonly etiqueta = input('');
  readonly elegir = output<void>();

  protected activar(evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.elegir.emit();
  }
}
