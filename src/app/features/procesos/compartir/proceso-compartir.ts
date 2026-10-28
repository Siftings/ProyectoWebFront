// Compartir un proceso: empresas con acceso y, para el administrador, buscar por NIT, compartir y revocar.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { detalleError } from '../../../core/errors/problem-detail';
import { CompartidosService } from '../../../core/services/compartidos.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { ProcesosService } from '../../../core/services/procesos.service';
import { UsuarioActualService } from '../../../core/services/usuario-actual.service';
import { EmpresaResumenResponse } from '../../../models/auth';
import { ProcesoCompartidoResponse } from '../../../models/compartido';
import { ProcesoResponse } from '../../../models/proceso';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { ErrorCampo } from '../../../shared/error-campo/error-campo';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AlertaError, ConfirmDialog, ErrorCampo],
  selector: 'app-proceso-compartir',
  styleUrl: './proceso-compartir.css',
  templateUrl: './proceso-compartir.html',
})
export class ProcesoCompartir {
  private readonly procesos = inject(ProcesosService);
  private readonly compartidos = inject(CompartidosService);
  private readonly empresas = inject(EmpresasService);
  private readonly router = inject(Router);
  private busqueda: Subscription | null = null;

  protected readonly usuario = inject(UsuarioActualService);
  protected readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly form = inject(FormBuilder).nonNullable.group({
    nit: ['', [Validators.required, Validators.pattern(/\S/)]],
  });
  readonly proceso = signal<ProcesoResponse | null>(null);
  readonly lista = signal<ProcesoCompartidoResponse[] | null>(null);
  readonly empresa = signal<EmpresaResumenResponse | null>(null);
  readonly buscando = signal(false);
  readonly compartiendo = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorFormulario = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);
  readonly pendiente = signal<ProcesoCompartidoResponse | null>(null);

  constructor() {
    if (!Number.isInteger(this.id)) {
      void this.router.navigate(['/procesos']);
      return;
    }
    this.procesos.obtener(this.id).subscribe({
      next: (detalle) => this.proceso.set(detalle.proceso),
      error: (err: unknown) => this.error.set(detalleError(err)),
    });
    this.recargar();
  }

  recargar(): void {
    this.compartidos.listar(this.id).subscribe({
      next: (lista) => this.lista.set(lista),
      error: (err: unknown) => this.error.set(detalleError(err)),
    });
  }

  nitCambiado(): void {
    this.busqueda?.unsubscribe();
    this.buscando.set(false);
    this.empresa.set(null);
    this.errorFormulario.set(null);
  }

  buscar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.nitCambiado();
    this.buscando.set(true);
    this.aviso.set(null);
    this.busqueda = this.empresas.buscarPorNit(this.form.getRawValue().nit.trim()).subscribe({
      next: (empresa) => {
        this.empresa.set(empresa);
        this.buscando.set(false);
      },
      error: (err: unknown) => {
        this.errorFormulario.set(detalleError(err));
        this.buscando.set(false);
      },
    });
  }

  compartir(): void {
    const empresa = this.empresa();
    if (!empresa || this.compartiendo()) {
      return;
    }
    this.compartiendo.set(true);
    this.errorFormulario.set(null);
    this.aviso.set(null);
    this.compartidos.compartir(this.id, empresa.id).subscribe({
      next: () => {
        this.aviso.set(`Proceso compartido con «${empresa.nombre}».`);
        this.form.reset();
        this.empresa.set(null);
        this.compartiendo.set(false);
        this.recargar();
      },
      error: (err: unknown) => {
        this.errorFormulario.set(detalleError(err));
        this.compartiendo.set(false);
      },
    });
  }

  cancelarBusqueda(): void {
    this.form.reset();
    this.nitCambiado();
  }

  revocar(): void {
    const compartido = this.pendiente();
    if (!compartido) {
      return;
    }
    this.pendiente.set(null);
    this.aviso.set(null);
    this.error.set(null);
    this.compartidos.revocar(this.id, compartido.empresaInvitadaId).subscribe({
      next: () => {
        this.aviso.set(`Acceso revocado a «${compartido.empresaInvitada}».`);
        this.recargar();
      },
      error: (err: unknown) => this.error.set(detalleError(err)),
    });
  }
}
