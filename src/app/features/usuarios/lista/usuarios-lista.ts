// Listado de usuarios activos de la empresa; desactivar pide confirmación. Solo administradores.
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { detalleError } from '../../../core/errors/problem-detail';
import { UsuarioActualService } from '../../../core/services/usuario-actual.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { UsuarioResponse } from '../../../models/auth';
import { ETIQUETAS_ROL_ACCESO } from '../../../models/enums';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  imports: [RouterLink, AlertaError, ConfirmDialog],
  selector: 'app-usuarios-lista',
  styleUrl: './usuarios-lista.css',
  templateUrl: './usuarios-lista.html',
})
export class UsuariosLista {
  private readonly usuarios = inject(UsuariosService);

  protected readonly actual = inject(UsuarioActualService);
  protected readonly etiquetasRol = ETIQUETAS_ROL_ACCESO;

  readonly lista = signal<UsuarioResponse[] | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);
  readonly pendiente = signal<UsuarioResponse | null>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.usuarios.listar().subscribe({
      next: (lista) => {
        this.lista.set(lista);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(detalleError(err));
        this.aviso.set(null);
        this.lista.set(null);
        this.cargando.set(false);
      },
    });
  }

  confirmar(): void {
    const usuario = this.pendiente();
    if (!usuario) {
      return;
    }
    this.pendiente.set(null);
    this.aviso.set(null);
    this.error.set(null);
    if (this.actual.esUsuarioActual(usuario.email)) {
      this.error.set('No puedes desactivarte a ti mismo.');
      return;
    }
    this.usuarios.desactivar(usuario.id).subscribe({
      next: () => {
        this.aviso.set('Usuario desactivado.');
        this.cargar();
      },
      error: (err: unknown) => this.error.set(detalleError(err)),
    });
  }
}
