// Formulario del panel del editor para crear (POST) o editar (PUT) una actividad.
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { erroresFormulario } from '../../core/errors/problem-detail';
import { NodosService } from '../../core/services/nodos.service';
import { ETIQUETAS_TIPO_ACTIVIDAD, TipoActividad } from '../../models/enums';
import { ActividadRequest, ActividadResponse } from '../../models/nodo';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { Punto } from '../../shared/diagrama/diagrama-layout';
import { ErrorCampo } from '../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, AlertaError, ErrorCampo],
  selector: 'app-actividad-formulario',
  templateUrl: './actividad-formulario.html',
})
export class ActividadFormulario {
  private readonly nodos = inject(NodosService);

  readonly laneId = input.required<number>();
  readonly actividad = input<ActividadResponse | null>(null);
  readonly posicionInicial = input<Punto>({ x: 40, y: 40 });
  readonly guardado = output<number>();
  readonly cancelar = output<void>();

  protected readonly tipos = Object.entries(ETIQUETAS_TIPO_ACTIVIDAD) as [TipoActividad, string][];

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    tipoActividad: ['TAREA' as TipoActividad, Validators.required],
    descripcion: [''],
    posicionX: [40, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    posicionY: [40, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  private readonly actividadId = computed(() => this.actividad()?.id ?? null);

  constructor() {
    effect(() => {
      this.actividadId();
      this.laneId();
      untracked(() => {
        const actividad = this.actividad();
        const inicial = this.posicionInicial();
        this.form.reset({
          nombre: actividad?.nombre ?? '',
          tipoActividad: actividad?.tipoActividad ?? 'TAREA',
          descripcion: actividad?.descripcion ?? '',
          posicionX: actividad?.posicionX ?? inicial.x,
          posicionY: actividad?.posicionY ?? inicial.y,
        });
        this.error.set(null);
        this.erroresCampo.set({});
      });
    });

    effect(() => {
      const actividad = this.actividad();
      if (actividad) {
        this.form.patchValue({ posicionX: actividad.posicionX, posicionY: actividad.posicionY });
      }
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    const descripcion = valor.descripcion.trim();
    const req: ActividadRequest = {
      nombre: valor.nombre.trim(),
      tipoActividad: valor.tipoActividad,
      posicionX: valor.posicionX,
      posicionY: valor.posicionY,
      ...(descripcion ? { descripcion } : {}),
    };
    const actividad = this.actividad();
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    const peticion = actividad
      ? this.nodos.editar('actividad', actividad.id, req)
      : this.nodos.crear('actividad', this.laneId(), req);
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: (guardada) => this.guardado.emit(guardada.id),
      error: (err: unknown) => {
        const { mensaje, campos } = erroresFormulario(err);
        this.error.set(mensaje);
        this.erroresCampo.set(campos);
      },
    });
  }
}
