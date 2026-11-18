// Aceptar una invitación: el invitado elige nombre y contraseña (POST /usuarios/invitaciones/{token}/aceptar) y va al login.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { erroresFormulario } from '../../core/errors/problem-detail';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { ErrorCampo } from '../../shared/error-campo/error-campo';
import { InvitacionesService } from '../../core/services/invitaciones.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AlertaError, ErrorCampo],
  selector: 'app-invitacion',
  templateUrl: './invitacion.html',
})
export class Invitacion {
  private readonly invitaciones = inject(InvitacionesService);
  private readonly router = inject(Router);
  private readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    this.invitaciones
      .aceptar(this.token, { nombre: valor.nombre.trim(), password: valor.password })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (usuario) =>
          void this.router.navigate(['/login'], { queryParams: { email: usuario.email } }),
        error: (err: unknown) => {
          const { mensaje, campos } = erroresFormulario(err);
          this.error.set(mensaje);
          this.erroresCampo.set(campos);
        },
      });
  }
}
