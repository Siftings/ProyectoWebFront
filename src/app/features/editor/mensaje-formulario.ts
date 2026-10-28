// Formulario del panel del editor para crear (POST) o editar (PUT) un mensaje entre dos pools.
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
import { MensajesService } from '../../core/services/mensajes.service';
import { ETIQUETAS_POLITICA_SIN_CASO, PoliticaMensajeSinCaso } from '../../models/enums';
import { MensajeResponse } from '../../models/mensaje';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { PoolArbol } from '../../shared/diagrama/diagrama-arbol';
import { ErrorCampo } from '../../shared/error-campo/error-campo';
import { NodoEvento, requestCrearMensaje, requestEditarMensaje } from './mensajes-editor';

@Component({
  imports: [ReactiveFormsModule, AlertaError, ErrorCampo],
  selector: 'app-mensaje-formulario',
  templateUrl: './mensaje-formulario.html',
})
export class MensajeFormulario {
  private readonly mensajes = inject(MensajesService);

  readonly procesoId = input.required<number>();
  readonly arbol = input<PoolArbol[]>([]);
  readonly origen = input<NodoEvento | null>(null);
  readonly candidatos = input<NodoEvento[]>([]);
  readonly catchId = input<number | null>(null);
  readonly mensaje = input<MensajeResponse | null>(null);
  readonly guardado = output<number>();
  readonly cancelar = output<void>();

  protected readonly politicas = Object.entries(ETIQUETAS_POLITICA_SIN_CASO) as [
    PoliticaMensajeSinCaso,
    string,
  ][];

  readonly form = inject(FormBuilder).nonNullable.group({
    catchId: [null as number | null],
    contenido: ['', [Validators.required, Validators.pattern(/\S/)]],
    politicaSinCaso: ['DESCARTAR' as PoliticaMensajeSinCaso],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  private readonly mensajeId = computed(() => this.mensaje()?.id ?? null);
  private readonly origenId = computed(() => this.origen()?.id ?? null);

  constructor() {
    effect(() => {
      this.mensajeId();
      this.origenId();
      untracked(() => {
        const mensaje = this.mensaje();
        const origen = this.origen();
        this.form.controls.catchId.setValidators(mensaje ? [] : [Validators.required]);
        this.form.reset({
          catchId: mensaje ? null : this.catchId(),
          contenido: mensaje?.contenido ?? origen?.contenido ?? '',
          politicaSinCaso: mensaje?.politicaSinCaso ?? 'DESCARTAR',
        });
        this.error.set(null);
        this.erroresCampo.set({});
      });
    });

    effect(() => {
      const elegido = this.catchId();
      if (!untracked(() => this.mensaje()) && elegido !== null) {
        this.form.controls.catchId.setValue(elegido);
      }
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    const mensaje = this.mensaje();
    const origen = this.origen();
    const destino = this.candidatos().find((n) => n.id === Number(valor.catchId));
    if (!mensaje && (!origen || !destino)) {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    const peticion = mensaje
      ? this.mensajes.editar(
          mensaje.id,
          requestEditarMensaje(mensaje, valor.contenido, valor.politicaSinCaso),
        )
      : this.mensajes.crear(
          this.procesoId(),
          requestCrearMensaje(
            this.arbol(),
            origen as NodoEvento,
            destino as NodoEvento,
            valor.contenido,
            valor.politicaSinCaso,
          ),
        );
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: (guardado) => this.guardado.emit(guardado.id),
      error: (err: unknown) => {
        const { mensaje: texto, campos } = erroresFormulario(err);
        this.error.set(texto);
        this.erroresCampo.set(campos);
      },
    });
  }
}
