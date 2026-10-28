// Formulario del panel del editor para crear (POST) o editar (PUT) un evento de mensaje.
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
import { ETIQUETAS_TIPO_EVENTO, TipoEventoMensaje } from '../../models/enums';
import { EventoMensajeRequest, EventoMensajeResponse } from '../../models/nodo';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { Punto } from '../../shared/diagrama/diagrama-layout';
import { ErrorCampo } from '../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, AlertaError, ErrorCampo],
  selector: 'app-evento-formulario',
  templateUrl: './evento-formulario.html',
})
export class EventoFormulario {
  private readonly nodos = inject(NodosService);

  readonly laneId = input.required<number>();
  readonly evento = input<EventoMensajeResponse | null>(null);
  readonly posicionInicial = input<Punto>({ x: 40, y: 40 });
  readonly guardado = output<number>();
  readonly cancelar = output<void>();

  protected readonly tipos = Object.entries(ETIQUETAS_TIPO_EVENTO) as [TipoEventoMensaje, string][];

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    tipoEvento: ['THROW' as TipoEventoMensaje, Validators.required],
    contenido: ['', [Validators.required, Validators.pattern(/\S/)]],
    claveCorrelacion: ['', [Validators.required, Validators.pattern(/\S/)]],
    origenExterno: [false],
    posicionX: [40, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    posicionY: [40, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  private readonly eventoId = computed(() => this.evento()?.id ?? null);

  constructor() {
    effect(() => {
      this.eventoId();
      this.laneId();
      untracked(() => {
        const evento = this.evento();
        const inicial = this.posicionInicial();
        this.form.reset({
          nombre: evento?.nombre ?? '',
          tipoEvento: evento?.tipoEvento ?? 'THROW',
          contenido: evento?.contenido ?? '',
          claveCorrelacion: evento?.claveCorrelacion ?? '',
          origenExterno: evento?.origenExterno ?? false,
          posicionX: evento?.posicionX ?? inicial.x,
          posicionY: evento?.posicionY ?? inicial.y,
        });
        this.error.set(null);
        this.erroresCampo.set({});
      });
    });

    effect(() => {
      const evento = this.evento();
      if (evento) {
        this.form.patchValue({ posicionX: evento.posicionX, posicionY: evento.posicionY });
      }
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    const req: EventoMensajeRequest = {
      nombre: valor.nombre.trim(),
      tipoEvento: valor.tipoEvento,
      contenido: valor.contenido.trim(),
      claveCorrelacion: valor.claveCorrelacion.trim(),
      origenExterno: valor.origenExterno,
      posicionX: valor.posicionX,
      posicionY: valor.posicionY,
    };
    const evento = this.evento();
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    const peticion = evento
      ? this.nodos.editar('evento', evento.id, req)
      : this.nodos.crear('evento', this.laneId(), req);
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
