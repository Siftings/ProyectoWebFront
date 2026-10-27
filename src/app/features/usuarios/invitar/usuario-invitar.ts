// Invitar a un usuario por correo y rol; muestra el enlace copiable y la fecha de expiración (no se envía correo).
import { DOCUMENT, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { erroresFormulario } from '../../../core/errors/problem-detail';
import { InvitacionesService } from '../../../core/services/invitaciones.service';
import { InvitacionUsuarioResponse } from '../../../models/auth';
import { ETIQUETAS_ROL_ACCESO, RolAcceso } from '../../../models/enums';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { ErrorCampo } from '../../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, RouterLink, DatePipe, AlertaError, ErrorCampo],
  selector: 'app-usuario-invitar',
  templateUrl: './usuario-invitar.html',
})
export class UsuarioInvitar {
  private readonly invitaciones = inject(InvitacionesService);
  private readonly origen = inject(DOCUMENT).location.origin;

  protected readonly roles = Object.entries(ETIQUETAS_ROL_ACCESO) as [RolAcceso, string][];
  protected readonly etiquetasRol = ETIQUETAS_ROL_ACCESO;

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    rolAcceso: ['EDITOR' as RolAcceso, Validators.required],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});
  readonly invitacion = signal<InvitacionUsuarioResponse | null>(null);
  readonly enlace = signal('');
  readonly copiado = signal<string | null>(null);

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    this.copiado.set(null);
    this.invitacion.set(null);
    this.invitaciones
      .crear({ email: valor.email.trim(), rolAcceso: valor.rolAcceso })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (invitacion) => {
          this.invitacion.set(invitacion);
          this.enlace.set(`${this.origen}/invitacion/${encodeURIComponent(invitacion.token)}`);
          this.form.reset({ email: '', rolAcceso: valor.rolAcceso });
        },
        error: (err: unknown) => {
          const { mensaje, campos } = erroresFormulario(err);
          this.error.set(mensaje);
          this.erroresCampo.set(campos);
        },
      });
  }

  copiar(): void {
    const noCopiado = 'No se pudo copiar. Selecciona el enlace y cópialo.';
    if (!navigator.clipboard) {
      this.copiado.set(noCopiado);
      return;
    }
    navigator.clipboard.writeText(this.enlace()).then(
      () => this.copiado.set('Enlace copiado.'),
      () => this.copiado.set(noCopiado),
    );
  }
}
