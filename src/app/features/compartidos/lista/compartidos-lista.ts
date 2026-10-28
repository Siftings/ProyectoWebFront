// Procesos que otras empresas compartieron con la mía (GET /procesos-compartidos, sin paginar).
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { detalleError } from '../../../core/errors/problem-detail';
import { CompartidosService } from '../../../core/services/compartidos.service';
import { ProcesoCompartidoResponse } from '../../../models/compartido';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';

@Component({
  imports: [RouterLink, AlertaError],
  selector: 'app-compartidos-lista',
  styleUrl: './compartidos-lista.css',
  templateUrl: './compartidos-lista.html',
})
export class CompartidosLista {
  readonly lista = signal<ProcesoCompartidoResponse[] | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    inject(CompartidosService)
      .recibidos()
      .subscribe({
        next: (lista) => this.lista.set(lista),
        error: (err: unknown) => this.error.set(detalleError(err)),
      });
  }
}
