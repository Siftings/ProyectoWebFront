// Alta de usuario (POST /usuarios) con contraseña asignada por el administrador.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { erroresFormulario } from '../../../core/errors/problem-detail';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ETIQUETAS_ROL_ACCESO, RolAcceso } from '../../../models/enums';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { ErrorCampo } from '../../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AlertaError, ErrorCampo],
  selector: 'app-usuario-formulario',
  templateUrl: './usuario-formulario.html',
})
export class UsuarioFormulario {
  private readonly usuarios = inject(UsuariosService);
  private readonly router = inject(Router);

  protected readonly roles = Object.entries(ETIQUETAS_ROL_ACCESO) as [RolAcceso, string][];

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rolAcceso: ['EDITOR' as RolAcceso, Validators.required],
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
    this.usuarios
      .crear({
        nombre: valor.nombre.trim(),
        email: valor.email.trim(),
        password: valor.password,
        rolAcceso: valor.rolAcceso,
      })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/usuarios']),
        error: (err: unknown) => {
          const { mensaje, campos } = erroresFormulario(err);
          this.error.set(mensaje);
          this.erroresCampo.set(campos);
        },
      });
  }
}
