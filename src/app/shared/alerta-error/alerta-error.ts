// Alerta de error con el detail del backend; no pinta nada si no hay mensaje.
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-alerta-error',
  template: `@if (mensaje()) {
    <p class="alerta alerta-error" role="alert">{{ mensaje() }}</p>
  }`,
})
export class AlertaError {
  readonly mensaje = input.required<string | null>();
}
