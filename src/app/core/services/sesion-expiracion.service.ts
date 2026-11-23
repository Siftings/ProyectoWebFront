// Cuenta regresiva del token: avisa en los últimos minutos, renueva la sesión o la cierra al llegar a cero.
import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { detalleError } from '../errors/problem-detail';
import { AuthService } from './auth.service';

export const AVISO_SEGUNDOS = 120;

@Injectable()
export class SesionExpiracionService {
  private readonly auth = inject(AuthService);
  private readonly ahora = signal(Date.now());
  private renovacion: Subscription | null = null;

  readonly segundosRestantes = computed(() => {
    const expiraEn = this.auth.expiraEn();
    return expiraEn === null ? null : Math.max(0, Math.ceil((expiraEn - this.ahora()) / 1000));
  });
  readonly mostrarAviso = computed(() => {
    const segundos = this.segundosRestantes();
    return segundos !== null && segundos <= AVISO_SEGUNDOS;
  });
  readonly renovando = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    const actualizar = (): void => this.ahora.set(Date.now());

    effect((alLimpiar) => {
      if (this.auth.expiraEn() === null) {
        untracked(() => this.renovacion?.unsubscribe());
        return;
      }
      actualizar();
      const intervalo = setInterval(actualizar, 1000);
      alLimpiar(() => clearInterval(intervalo));
    });

    effect(() => {
      if (this.segundosRestantes() === 0) {
        untracked(() => this.expirar());
      }
    });

    document.addEventListener('visibilitychange', actualizar);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('visibilitychange', actualizar));
  }

  continuar(): void {
    if (this.renovando()) {
      return;
    }
    this.renovando.set(true);
    this.error.set(null);
    this.renovacion = this.auth
      .refrescar()
      .pipe(finalize(() => this.renovando.set(false)))
      .subscribe({ error: (err: unknown) => this.error.set(detalleError(err)) });
  }

  private expirar(): void {
    this.error.set(null);
    this.auth.cerrarPorVencimiento();
  }
}
