// Formulario del panel del editor para crear (POST) o editar (PUT parcial) un arco entre dos nodos.
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
import { ArcosService } from '../../core/services/arcos.service';
import { ArcoResponse } from '../../models/arco';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { NodoDiagrama } from '../../shared/diagrama/diagrama-arbol';
import { ErrorCampo } from '../../shared/error-campo/error-campo';
import { requestCrearArco, requestEditarArco, requiereCondicion } from './arcos-editor';

@Component({
  imports: [ReactiveFormsModule, AlertaError, ErrorCampo],
  selector: 'app-arco-formulario',
  templateUrl: './arco-formulario.html',
})
export class ArcoFormulario {
  private readonly arcos = inject(ArcosService);

  readonly origen = input.required<NodoDiagrama>();
  readonly destinos = input<NodoDiagrama[]>([]);
  readonly destinoId = input<number | null>(null);
  readonly arco = input<ArcoResponse | null>(null);
  readonly guardado = output<number>();
  readonly cancelar = output<void>();

  readonly form = inject(FormBuilder).nonNullable.group({
    destinoId: [null as number | null],
    etiqueta: ['', Validators.maxLength(255)],
    condicion: ['', Validators.maxLength(255)],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  protected readonly condicionObligatoria = computed(() => requiereCondicion(this.origen()));
  private readonly arcoId = computed(() => this.arco()?.id ?? null);
  private readonly origenId = computed(() => this.origen().id);

  constructor() {
    effect(() => {
      this.arcoId();
      this.origenId();
      const obligatoria = this.condicionObligatoria();
      untracked(() => {
        const arco = this.arco();
        const { destinoId, condicion } = this.form.controls;
        destinoId.setValidators(arco ? [] : [Validators.required]);
        condicion.setValidators([
          Validators.maxLength(255),
          ...(obligatoria ? [Validators.required, Validators.pattern(/\S/)] : []),
        ]);
        this.form.reset({
          destinoId: arco ? null : this.destinoId(),
          etiqueta: arco?.etiqueta ?? '',
          condicion: arco?.condicion ?? '',
        });
        this.error.set(null);
        this.erroresCampo.set({});
      });
    });

    effect(() => {
      const elegido = this.destinoId();
      if (!untracked(() => this.arco()) && elegido !== null) {
        this.form.controls.destinoId.setValue(elegido);
      }
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    const arco = this.arco();
    if (!arco && valor.destinoId === null) {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    const peticion = arco
      ? this.arcos.editar(arco.id, requestEditarArco(valor.etiqueta, valor.condicion))
      : this.arcos.crear(
          requestCrearArco(
            this.origen().id,
            Number(valor.destinoId),
            valor.etiqueta,
            valor.condicion,
          ),
        );
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: (guardado) => this.guardado.emit(guardado.id),
      error: (err: unknown) => {
        const { mensaje, campos } = erroresFormulario(err);
        this.error.set(mensaje);
        this.erroresCampo.set(campos);
      },
    });
  }
}
