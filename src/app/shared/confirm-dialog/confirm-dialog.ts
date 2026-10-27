// Diálogo de confirmación sobre dialog nativo; el padre controla `abierto` y reacciona a confirmar y cancelar.
import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  styleUrl: './confirm-dialog.css',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  readonly abierto = input.required<boolean>();
  readonly titulo = input.required<string>();
  readonly mensaje = input('');
  readonly advertencias = input<string[]>([]);
  readonly textoConfirmar = input('Confirmar');
  readonly peligro = input(false);
  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const dialogo = this.dialogo().nativeElement;
      if (this.abierto() && !dialogo.open) {
        dialogo.showModal();
      } else if (!this.abierto() && dialogo.open) {
        dialogo.close();
      }
    });
  }

  protected alCancelar(evento: Event): void {
    evento.preventDefault();
    this.cancelar.emit();
  }

  protected alCerrar(): void {
    if (this.abierto()) {
      this.cancelar.emit();
    }
  }
}
