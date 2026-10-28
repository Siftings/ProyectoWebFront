// Correlación de un mensaje en el panel del editor: consulta, guarda (upsert) y elimina el criterio.
import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { detalleError } from '../../core/errors/problem-detail';
import { CorrelacionesService } from '../../core/services/correlaciones.service';
import { CorrelacionResponse } from '../../models/mensaje';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { ErrorCampo } from '../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, AlertaError, ErrorCampo],
  selector: 'app-correlacion-panel',
  styles: `
    :host {
      display: block;
      margin-top: var(--space-6);
    }
    .botones {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
  template: `
    <h3>Correlación</h3>
    <app-alerta-error [mensaje]="error()" />
    @if (cargando()) {
      <p>Cargando…</p>
    } @else if (correlacion(); as c) {
      <p>Criterio actual: {{ c.criterio }}</p>
    } @else if (!error()) {
      <p>Sin correlación definida.</p>
    }

    @if (puedeEditar()) {
      <form class="formulario" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <p>El criterio debe coincidir con la clave de correlación del evento de envío.</p>
        <div class="campo">
          <label [for]="'correlacion-criterio-' + mensajeId()">Criterio</label>
          <input
            [id]="'correlacion-criterio-' + mensajeId()"
            type="text"
            formControlName="criterio"
            autocomplete="off"
          />
          <app-error-campo
            [mostrar]="form.controls.criterio.touched && form.controls.criterio.invalid"
            mensaje="Ingresa el criterio de correlación."
          />
        </div>
        <div class="botones">
          <button type="submit" [disabled]="enviando()">
            {{ enviando() ? 'Guardando…' : 'Guardar correlación' }}
          </button>
          @if (puedeEliminar() && correlacion()) {
            <button type="button" class="btn-peligro" [disabled]="enviando()" (click)="eliminar()">
              Eliminar correlación
            </button>
          }
        </div>
      </form>
    }
  `,
})
export class CorrelacionPanel {
  private readonly api = inject(CorrelacionesService);

  readonly mensajeId = input.required<number>();
  readonly puedeEditar = input(false);
  readonly puedeEliminar = input(false);
  readonly cambio = output<void>();

  readonly form = inject(FormBuilder).nonNullable.group({
    criterio: ['', [Validators.required, Validators.pattern(/\S/)]],
  });
  readonly correlacion = signal<CorrelacionResponse | null>(null);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.mensajeId();
      untracked(() => this.cargar(id));
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.mensajeId();
    this.enviando.set(true);
    this.error.set(null);
    this.api
      .guardar(id, { criterio: this.form.getRawValue().criterio.trim() })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (c) => {
          if (this.mensajeId() === id) {
            this.correlacion.set(c);
          }
          this.cambio.emit();
        },
        error: (err: unknown) => {
          if (this.mensajeId() === id) {
            this.error.set(detalleError(err));
          }
        },
      });
  }

  eliminar(): void {
    const id = this.mensajeId();
    this.enviando.set(true);
    this.error.set(null);
    this.api
      .eliminar(id)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => {
          if (this.mensajeId() === id) {
            this.correlacion.set(null);
            this.form.reset({ criterio: '' });
          }
          this.cambio.emit();
        },
        error: (err: unknown) => {
          if (this.mensajeId() === id) {
            this.error.set(detalleError(err));
          }
        },
      });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.correlacion.set(null);
    this.api
      .obtener(id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (c) => {
          if (this.mensajeId() === id) {
            this.correlacion.set(c);
            this.form.reset({ criterio: c.criterio });
          }
        },
        error: (err: unknown) => {
          if (this.mensajeId() !== id) {
            return;
          }
          this.form.reset({ criterio: '' });
          if (!(err instanceof HttpErrorResponse && err.status === 404)) {
            this.error.set(detalleError(err));
          }
        },
      });
  }
}
