// Formulario del panel del editor para crear (POST) o editar (PUT) un gateway.
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
import { ETIQUETAS_TIPO_GATEWAY, TipoGateway } from '../../models/enums';
import { GatewayRequest, GatewayResponse } from '../../models/nodo';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { Punto } from '../../shared/diagrama/diagrama-layout';
import { ErrorCampo } from '../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, AlertaError, ErrorCampo],
  selector: 'app-gateway-formulario',
  templateUrl: './gateway-formulario.html',
})
export class GatewayFormulario {
  private readonly nodos = inject(NodosService);

  readonly laneId = input.required<number>();
  readonly gateway = input<GatewayResponse | null>(null);
  readonly posicionInicial = input<Punto>({ x: 40, y: 40 });
  readonly guardado = output<number>();
  readonly cancelar = output<void>();

  protected readonly tipos = Object.entries(ETIQUETAS_TIPO_GATEWAY) as [TipoGateway, string][];

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    tipoGateway: ['EXCLUSIVO' as TipoGateway, Validators.required],
    posicionX: [40, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    posicionY: [40, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  private readonly gatewayId = computed(() => this.gateway()?.id ?? null);

  constructor() {
    effect(() => {
      this.gatewayId();
      this.laneId();
      untracked(() => {
        const gateway = this.gateway();
        const inicial = this.posicionInicial();
        this.form.reset({
          nombre: gateway?.nombre ?? '',
          tipoGateway: gateway?.tipoGateway ?? 'EXCLUSIVO',
          posicionX: gateway?.posicionX ?? inicial.x,
          posicionY: gateway?.posicionY ?? inicial.y,
        });
        this.error.set(null);
        this.erroresCampo.set({});
      });
    });

    effect(() => {
      const gateway = this.gateway();
      if (gateway) {
        this.form.patchValue({ posicionX: gateway.posicionX, posicionY: gateway.posicionY });
      }
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    const req: GatewayRequest = {
      nombre: valor.nombre.trim(),
      tipoGateway: valor.tipoGateway,
      posicionX: valor.posicionX,
      posicionY: valor.posicionY,
    };
    const gateway = this.gateway();
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    const peticion = gateway
      ? this.nodos.editar('gateway', gateway.id, req)
      : this.nodos.crear('gateway', this.laneId(), req);
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
