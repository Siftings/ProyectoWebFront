// Listado paginado de roles de proceso con filtro por nombre; eliminar pide confirmación.
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, map, switchMap } from 'rxjs';
import { detalleError } from '../../../core/errors/problem-detail';
import { RolesService } from '../../../core/services/roles.service';
import { UsuarioActualService } from '../../../core/services/usuario-actual.service';
import { PageResponse } from '../../../models/comun';
import { RolProcesoConsultaResponse } from '../../../models/rol-proceso';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { Paginador } from '../../../shared/paginador/paginador';

interface Consulta {
  nombre: string;
  pagina: number;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, AlertaError, ConfirmDialog, Paginador],
  selector: 'app-roles-lista',
  styleUrl: './roles-lista.css',
  templateUrl: './roles-lista.html',
})
export class RolesLista {
  private readonly roles = inject(RolesService);
  private readonly consultas = new Subject<Consulta>();

  protected readonly usuario = inject(UsuarioActualService);

  readonly form = inject(FormBuilder).nonNullable.group({ nombre: [''] });
  readonly nombre = signal('');
  readonly pagina = signal(0);
  readonly resultado = signal<PageResponse<RolProcesoConsultaResponse> | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);
  readonly pendiente = signal<RolProcesoConsultaResponse | null>(null);

  constructor() {
    this.consultas
      .pipe(
        switchMap((consulta) =>
          this.roles.listar(consulta.nombre, consulta.pagina).pipe(
            map((resultado) => ({ consulta, resultado })),
            catchError((err: unknown) => {
              this.error.set(detalleError(err));
              this.aviso.set(null);
              this.resultado.set(null);
              this.cargando.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ consulta, resultado }) => {
        if (resultado.content.length === 0 && consulta.pagina > 0) {
          this.cargar(consulta.pagina - 1);
          return;
        }
        this.pagina.set(consulta.pagina);
        this.resultado.set(resultado);
        this.cargando.set(false);
      });
    this.cargar(0);
  }

  buscar(): void {
    this.nombre.set(this.form.getRawValue().nombre.trim());
    this.aviso.set(null);
    this.cargar(0);
  }

  limpiar(): void {
    this.form.reset();
    this.buscar();
  }

  cargar(pagina: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.consultas.next({ nombre: this.nombre(), pagina });
  }

  confirmar(): void {
    const rol = this.pendiente();
    if (!rol) {
      return;
    }
    this.pendiente.set(null);
    this.aviso.set(null);
    this.error.set(null);
    this.roles.eliminar(rol.id).subscribe({
      next: () => {
        this.aviso.set('Rol eliminado.');
        this.cargar(this.pagina());
      },
      error: (err: unknown) => this.error.set(detalleError(err)),
    });
  }
}
