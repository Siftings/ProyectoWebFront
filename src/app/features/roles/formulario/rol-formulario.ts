// Formulario para crear (POST /roles) y editar (PUT /roles/{id}) un rol de proceso; solo administradores.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { detalleError, erroresFormulario } from '../../../core/errors/problem-detail';
import { RolesService } from '../../../core/services/roles.service';
import { UsuarioActualService } from '../../../core/services/usuario-actual.service';
import { RolProcesoRequest } from '../../../models/rol-proceso';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { ErrorCampo } from '../../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AlertaError, ErrorCampo],
  selector: 'app-rol-formulario',
  templateUrl: './rol-formulario.html',
})
export class RolFormulario {
  private readonly roles = inject(RolesService);
  private readonly router = inject(Router);
  private readonly idParam = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly esAdmin = inject(UsuarioActualService).esAdmin;
  protected readonly id = this.idParam === null ? null : Number(this.idParam);

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    descripcion: ['', Validators.maxLength(255)],
  });
  readonly cargando = signal(false);
  readonly cargado = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  constructor() {
    if (this.id !== null && !Number.isInteger(this.id)) {
      void this.router.navigate(['/roles']);
      return;
    }
    if (!this.esAdmin()) {
      return;
    }
    if (this.id === null) {
      this.cargado.set(true);
      return;
    }
    this.cargando.set(true);
    this.roles
      .obtener(this.id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (rol) => {
          this.form.patchValue({ nombre: rol.nombre, descripcion: rol.descripcion ?? '' });
          this.cargado.set(true);
        },
        error: (err: unknown) => this.error.set(detalleError(err)),
      });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    const descripcion = valor.descripcion.trim();
    const req: RolProcesoRequest = { nombre: valor.nombre.trim() };
    if (descripcion) {
      req.descripcion = descripcion;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    const peticion = this.id === null ? this.roles.crear(req) : this.roles.editar(this.id, req);
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: () => void this.router.navigate(['/roles']),
      error: (err: unknown) => {
        const { mensaje, campos } = erroresFormulario(err);
        this.error.set(mensaje);
        this.erroresCampo.set(campos);
      },
    });
  }
}
