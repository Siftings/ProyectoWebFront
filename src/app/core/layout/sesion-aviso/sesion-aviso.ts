// Aviso modal de fin de sesión: muestra la cuenta regresiva del token y permite renovarlo o salir.
import { Component, ElementRef, effect, inject, output, viewChild } from '@angular/core';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { SesionExpiracionService } from '../../services/sesion-expiracion.service';

@Component({
  imports: [AlertaError],
  providers: [SesionExpiracionService],
  selector: 'app-sesion-aviso',
  styleUrl: './sesion-aviso.css',
  templateUrl: './sesion-aviso.html',
})
export class SesionAviso {
  protected readonly sesion = inject(SesionExpiracionService);
  readonly cerrarSesion = output<void>();

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => this.sincronizar());
  }

  protected sincronizar(): void {
    const dialogo = this.dialogo().nativeElement;
    const mostrar = this.sesion.mostrarAviso();
    if (mostrar && !dialogo.open) {
      dialogo.showModal();
    } else if (!mostrar && dialogo.open) {
      dialogo.close();
    }
  }
}
