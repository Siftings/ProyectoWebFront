// Listado paginado de procesos con filtros; publicar y eliminar piden confirmación en un solo diálogo.
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EMPTY, Observable, Subject, catchError, map, switchMap } from 'rxjs';
import { detalleError } from '../../../core/errors/problem-detail';
import { FiltrosProceso, ProcesosService } from '../../../core/services/procesos.service';
import { UsuarioActualService } from '../../../core/services/usuario-actual.service';
import { PageResponse } from '../../../models/comun';
import { ETIQUETAS_ESTADO_PROCESO, EstadoProceso } from '../../../models/enums';
import { ProcesoResponse } from '../../../models/proceso';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EstadoBadge } from '../../../shared/estado-badge/estado-badge';
import { Paginador } from '../../../shared/paginador/paginador';

interface Consulta {
  filtros: FiltrosProceso;
  pagina: number;
}

interface Pendiente {
  accion: 'publicar' | 'eliminar';
  proceso: ProcesoResponse;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, DatePipe, AlertaError, ConfirmDialog, EstadoBadge, Paginador],
  selector: 'app-procesos-lista',
  styleUrl: './procesos-lista.css',
  templateUrl: './procesos-lista.html',
})
export class ProcesosLista {
  private readonly procesos = inject(ProcesosService);
  private readonly consultas = new Subject<Consulta>();

  protected readonly usuario = inject(UsuarioActualService);
  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_PROCESO;

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: [''],
    estado: ['' as '' | EstadoProceso],
    categoria: [''],
    vista: ['activos' as 'activos' | 'eliminados'],
  });
  readonly filtros = signal<FiltrosProceso>({});
  readonly mostrados = signal<FiltrosProceso>({});
  readonly pagina = signal(0);
  readonly resultado = signal<PageResponse<ProcesoResponse> | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);
  readonly pendiente = signal<Pendiente | null>(null);

  protected readonly eliminados = computed(() => this.mostrados().activo === false);
  protected readonly textos = computed(() => {
    const p = this.pendiente();
    if (p?.accion === 'publicar') {
      return {
        titulo: 'Publicar proceso',
        mensaje: `Al publicar «${p.proceso.nombre}» su diagrama queda congelado y el proceso no puede volver a borrador.`,
        confirmar: 'Publicar',
        peligro: false,
      };
    }
    return {
      titulo: 'Eliminar proceso',
      mensaje: p ? `Se eliminará «${p.proceso.nombre}».` : '',
      confirmar: 'Eliminar',
      peligro: true,
    };
  });

  constructor() {
    this.consultas
      .pipe(
        switchMap((consulta) =>
          this.procesos.listar(consulta.filtros, consulta.pagina).pipe(
            map((resultado) => ({ consulta, resultado })),
            catchError((err: unknown) => {
              this.error.set(detalleError(err));
              this.resultado.set(null);
              this.cargando.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ consulta, resultado }) => {
        if (resultado.content.length === 0 && consulta.pagina > 0) {
          this.cargar(consulta.pagina - 1);
          return;
        }
        this.pagina.set(consulta.pagina);
        this.mostrados.set(consulta.filtros);
        this.resultado.set(resultado);
        this.cargando.set(false);
      });
    this.cargar(0);
  }

  buscar(): void {
    const valor = this.form.getRawValue();
    const filtros: FiltrosProceso = {};
    if (valor.nombre.trim()) {
      filtros.nombre = valor.nombre.trim();
    }
    if (valor.estado) {
      filtros.estado = valor.estado;
    }
    if (valor.categoria.trim()) {
      filtros.categoria = valor.categoria.trim();
    }
    if (valor.vista === 'eliminados') {
      filtros.activo = false;
    }
    this.filtros.set(filtros);
    this.aviso.set(null);
    this.cargar(0);
  }

  limpiar(): void {
    this.form.reset();
    this.buscar();
  }

  cargar(pagina: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.consultas.next({ filtros: this.filtros(), pagina });
  }

  pedir(accion: Pendiente['accion'], proceso: ProcesoResponse): void {
    this.pendiente.set({ accion, proceso });
  }

  confirmar(): void {
    const pendiente = this.pendiente();
    if (!pendiente) {
      return;
    }
    this.pendiente.set(null);
    const { accion, proceso } = pendiente;
    const peticion: Observable<unknown> =
      accion === 'publicar' ? this.procesos.publicar(proceso.id) : this.procesos.eliminar(proceso.id);
    this.aviso.set(null);
    this.error.set(null);
    peticion.subscribe({
      next: () => {
        this.aviso.set(accion === 'publicar' ? 'Proceso publicado.' : 'Proceso eliminado.');
        this.cargar(this.pagina());
      },
      error: (err: unknown) => this.error.set(detalleError(err)),
    });
  }
}
