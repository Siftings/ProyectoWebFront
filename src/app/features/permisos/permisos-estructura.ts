// Permisos de estructura por rol (crear, editar y eliminar pools y lanes). Se guarda un rol a la vez. Solo administradores.
import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { detalleError } from '../../core/errors/problem-detail';
import { PermisosEstructuraService } from '../../core/services/permisos-estructura.service';
import { ETIQUETAS_ROL_ACCESO, RolAcceso } from '../../models/enums';
import { PermisoEstructuraRequest, PermisoEstructuraResponse } from '../../models/permisos';
import { AlertaError } from '../../shared/alerta-error/alerta-error';

type Permiso = keyof PermisoEstructuraRequest;

@Component({
  imports: [AlertaError],
  selector: 'app-permisos-estructura',
  styleUrl: './permisos-estructura.css',
  templateUrl: './permisos-estructura.html',
})
export class PermisosEstructura {
  private readonly permisos = inject(PermisosEstructuraService);

  protected readonly etiquetasRol = ETIQUETAS_ROL_ACCESO;
  protected readonly columnas: { campo: Permiso; texto: string }[] = [
    { campo: 'crearPool', texto: 'Crear pool' },
    { campo: 'editarPool', texto: 'Editar pool' },
    { campo: 'eliminarPool', texto: 'Eliminar pool' },
    { campo: 'crearLane', texto: 'Crear lane' },
    { campo: 'editarLane', texto: 'Editar lane' },
    { campo: 'eliminarLane', texto: 'Eliminar lane' },
  ];

  readonly filas = signal<PermisoEstructuraResponse[] | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);
  readonly guardando = signal<RolAcceso | null>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.permisos
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (filas) => this.filas.set(filas),
        error: (err: unknown) => {
          this.filas.set(null);
          this.error.set(detalleError(err));
        },
      });
  }

  marcar(rol: RolAcceso, campo: Permiso, valor: boolean): void {
    this.reemplazar(rol, (fila) => ({ ...fila, [campo]: valor }));
  }

  guardar(fila: PermisoEstructuraResponse): void {
    this.guardando.set(fila.rolAcceso);
    this.aviso.set(null);
    this.error.set(null);
    this.permisos
      .actualizar(fila.rolAcceso, fila)
      .pipe(finalize(() => this.guardando.set(null)))
      .subscribe({
        next: (guardada) => {
          this.reemplazar(guardada.rolAcceso, () => guardada);
          this.aviso.set(`Permisos de ${this.etiquetasRol[guardada.rolAcceso]} guardados.`);
        },
        error: (err: unknown) => this.error.set(detalleError(err)),
      });
  }

  private reemplazar(
    rol: RolAcceso,
    cambio: (fila: PermisoEstructuraResponse) => PermisoEstructuraResponse,
  ): void {
    this.filas.update((filas) => filas && filas.map((f) => (f.rolAcceso === rol ? cambio(f) : f)));
  }
}
