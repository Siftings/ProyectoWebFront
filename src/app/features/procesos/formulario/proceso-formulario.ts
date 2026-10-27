// Formulario para crear (POST /procesos) y editar (PUT /procesos/{id}) un proceso.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { detalleError, erroresFormulario } from '../../../core/errors/problem-detail';
import { ProcesosService } from '../../../core/services/procesos.service';
import { EstadoProceso } from '../../../models/enums';
import { ProcesoRequest } from '../../../models/proceso';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { ErrorCampo } from '../../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AlertaError, ErrorCampo],
  selector: 'app-proceso-formulario',
  templateUrl: './proceso-formulario.html',
})
export class ProcesoFormulario {
  private readonly procesos = inject(ProcesosService);
  private readonly router = inject(Router);
  private readonly idParam = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly id = this.idParam === null ? null : Number(this.idParam);

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/)]],
    descripcion: ['', [Validators.required, Validators.pattern(/\S/)]],
    categoria: ['', [Validators.required, Validators.pattern(/\S/)]],
  });
  readonly cargando = signal(false);
  readonly cargado = signal(false);
  readonly estado = signal<EstadoProceso | null>(null);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  constructor() {
    if (this.id !== null && !Number.isInteger(this.id)) {
      void this.router.navigate(['/procesos']);
      return;
    }
    if (this.id === null) {
      this.cargado.set(true);
      return;
    }
    this.cargando.set(true);
    this.procesos
      .obtener(this.id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: ({ proceso }) => {
          this.form.patchValue(proceso);
          this.estado.set(proceso.estado);
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
    const req: ProcesoRequest = {
      nombre: valor.nombre.trim(),
      descripcion: valor.descripcion.trim(),
      categoria: valor.categoria.trim(),
    };
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    const peticion = this.id === null ? this.procesos.crear(req) : this.procesos.editar(this.id, req);
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: () => void this.router.navigate(['/procesos']),
      error: (err: unknown) => {
        const { mensaje, campos } = erroresFormulario(err);
        this.error.set(mensaje);
        this.erroresCampo.set(campos);
      },
    });
  }
}
