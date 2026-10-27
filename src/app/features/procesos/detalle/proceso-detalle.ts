// Detalle de un proceso: sus datos y el historial de cambios que trae GET /procesos/{id}.
import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { detalleError } from '../../../core/errors/problem-detail';
import { ProcesosService } from '../../../core/services/procesos.service';
import { UsuarioActualService } from '../../../core/services/usuario-actual.service';
import { ProcesoDetalleResponse } from '../../../models/proceso';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { EstadoBadge } from '../../../shared/estado-badge/estado-badge';

@Component({
  imports: [RouterLink, DatePipe, AlertaError, EstadoBadge],
  selector: 'app-proceso-detalle',
  styleUrl: './proceso-detalle.css',
  templateUrl: './proceso-detalle.html',
})
export class ProcesoDetalle {
  private readonly procesos = inject(ProcesosService);
  private readonly router = inject(Router);
  private readonly idParam = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly usuario = inject(UsuarioActualService);
  protected readonly id = Number(this.idParam);

  readonly detalle = signal<ProcesoDetalleResponse | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    if (!Number.isInteger(this.id)) {
      void this.router.navigate(['/procesos']);
      return;
    }
    this.cargando.set(true);
    this.procesos
      .obtener(this.id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (detalle) => this.detalle.set(detalle),
        error: (err: unknown) => this.error.set(detalleError(err)),
      });
  }
}
