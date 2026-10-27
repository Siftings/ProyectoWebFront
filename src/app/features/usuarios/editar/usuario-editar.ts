// Cambiar el rol y el estado activo de un usuario (PATCH /usuarios/{id}); no permite editarse a uno mismo.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { detalleError } from '../../../core/errors/problem-detail';
import { UsuarioActualService } from '../../../core/services/usuario-actual.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { UsuarioResponse } from '../../../models/auth';
import { ETIQUETAS_ROL_ACCESO, RolAcceso } from '../../../models/enums';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';

const MENSAJE_PROPIO = 'No puedes cambiar tu propio rol ni desactivarte.';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AlertaError],
  selector: 'app-usuario-editar',
  templateUrl: './usuario-editar.html',
})
export class UsuarioEditar {
  private readonly usuarios = inject(UsuariosService);
  private readonly actual = inject(UsuarioActualService);
  private readonly router = inject(Router);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly roles = Object.entries(ETIQUETAS_ROL_ACCESO) as [RolAcceso, string][];

  readonly form = inject(FormBuilder).nonNullable.group({
    rolAcceso: ['EDITOR' as RolAcceso],
    activo: [true],
  });
  readonly usuario = signal<UsuarioResponse | null>(null);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    if (!Number.isInteger(this.id)) {
      void this.router.navigate(['/usuarios']);
      return;
    }
    this.cargando.set(true);
    this.usuarios
      .obtener(this.id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (usuario) => {
          if (this.actual.esUsuarioActual(usuario.email)) {
            this.error.set(MENSAJE_PROPIO);
            return;
          }
          this.form.patchValue({ rolAcceso: usuario.rolAcceso, activo: usuario.activo });
          this.usuario.set(usuario);
        },
        error: (err: unknown) => this.error.set(detalleError(err)),
      });
  }

  enviar(): void {
    const usuario = this.usuario();
    if (!usuario) {
      return;
    }
    if (this.actual.esUsuarioActual(usuario.email)) {
      this.error.set(MENSAJE_PROPIO);
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.usuarios
      .actualizar(usuario.id, this.form.getRawValue())
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/usuarios']),
        error: (err: unknown) => this.error.set(detalleError(err)),
      });
  }
}
