// Errores de un campo: el de validación local y el que devuelve el servidor.
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-campo',
  template: `@if (mostrar()) {
      <p class="error-campo">{{ mensaje() }}</p>
    }
    @if (servidor()) {
      <p class="error-campo">{{ servidor() }}</p>
    }`,
})
export class ErrorCampo {
  readonly mostrar = input.required<boolean>();
  readonly mensaje = input.required<string>();
  readonly servidor = input<string>();
}
