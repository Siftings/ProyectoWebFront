// Formulario del panel del editor para crear (POST) o editar (PUT) una lane y elegir su rol de proceso.
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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { detalleError, erroresFormulario } from '../../core/errors/problem-detail';
import { LanesService } from '../../core/services/lanes.service';
import { RolesService } from '../../core/services/roles.service';
import { UsuarioActualService } from '../../core/services/usuario-actual.service';
import { LaneRequest, LaneResponse } from '../../models/pool-lane';
import { RolProcesoVistaResponse } from '../../models/rol-proceso';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { ErrorCampo } from '../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AlertaError, ErrorCampo],
  selector: 'app-lane-formulario',
  templateUrl: './lane-formulario.html',
})
export class LaneFormulario {
  private readonly lanes = inject(LanesService);

  readonly poolId = input.required<number>();
  readonly lane = input<LaneResponse | null>(null);
  readonly guardado = output<number>();
  readonly cancelar = output<void>();

  protected readonly esAdmin = inject(UsuarioActualService).esAdmin;

  readonly form = inject(FormBuilder).group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    rolProcesoId: [null as number | null, Validators.required],
  });
  readonly roles = signal<RolProcesoVistaResponse[]>([]);
  readonly cargandoRoles = signal(true);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  private readonly laneId = computed(() => this.lane()?.id ?? null);

  constructor() {
    inject(RolesService)
      .todos()
      .pipe(finalize(() => this.cargandoRoles.set(false)))
      .subscribe({
        next: (roles) => this.roles.set(roles),
        error: (err: unknown) => this.error.set(detalleError(err)),
      });

    effect(() => {
      this.laneId();
      untracked(() => {
        const lane = this.lane();
        this.form.reset({ nombre: lane?.nombre ?? '', rolProcesoId: lane?.rolProcesoId ?? null });
        this.error.set(null);
        this.erroresCampo.set({});
      });
    });
  }

  enviar(): void {
    const valor = this.form.getRawValue();
    if (this.form.invalid || valor.rolProcesoId === null) {
      this.form.markAllAsTouched();
      return;
    }
    const req: LaneRequest = {
      nombre: (valor.nombre ?? '').trim(),
      rolProcesoId: valor.rolProcesoId,
    };
    const lane = this.lane();
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    const peticion = lane ? this.lanes.editar(lane.id, req) : this.lanes.crear(this.poolId(), req);
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
