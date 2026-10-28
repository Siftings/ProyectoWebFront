// Formulario del panel del editor para crear (POST) o editar (PUT) un pool.
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
import { PoolsService } from '../../core/services/pools.service';
import { ETIQUETAS_TIPO_PARTICIPANTE, TipoParticipante } from '../../models/enums';
import { PoolRequest, PoolResponse } from '../../models/pool-lane';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { ErrorCampo } from '../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, AlertaError, ErrorCampo],
  selector: 'app-pool-formulario',
  templateUrl: './pool-formulario.html',
})
export class PoolFormulario {
  private readonly pools = inject(PoolsService);

  readonly procesoId = input.required<number>();
  readonly pool = input<PoolResponse | null>(null);
  readonly guardado = output<number>();
  readonly cancelar = output<void>();

  protected readonly tipos = Object.entries(ETIQUETAS_TIPO_PARTICIPANTE) as [
    TipoParticipante,
    string,
  ][];

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    tipoParticipante: ['EMPRESA' as TipoParticipante, Validators.required],
    cajaNegra: [false],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  private readonly poolId = computed(() => this.pool()?.id ?? null);

  constructor() {
    effect(() => {
      this.poolId();
      untracked(() => {
        const pool = this.pool();
        this.form.reset({
          nombre: pool?.nombre ?? '',
          tipoParticipante: pool?.tipoParticipante ?? 'EMPRESA',
          cajaNegra: pool?.cajaNegra ?? false,
        });
        this.error.set(null);
        this.erroresCampo.set({});
      });
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    const req: PoolRequest = {
      nombre: valor.nombre.trim(),
      tipoParticipante: valor.tipoParticipante,
      cajaNegra: valor.cajaNegra,
    };
    const pool = this.pool();
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    const peticion = pool
      ? this.pools.editar(pool.id, req)
      : this.pools.crear(this.procesoId(), req);
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
