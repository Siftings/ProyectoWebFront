// Visor de solo lectura de un proceso compartido: dibuja su diagrama con el mismo lienzo del editor.
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { detalleError } from '../../../core/errors/problem-detail';
import { CompartidosService } from '../../../core/services/compartidos.service';
import { ProcesoCompartidoDetalleResponse } from '../../../models/compartido';
import { AlertaError } from '../../../shared/alerta-error/alerta-error';
import { armarArbol, Seleccion } from '../../../shared/diagrama/diagrama-arbol';
import { DiagramaCanvas } from '../../../shared/diagrama/diagrama-canvas';
import { EstadoBadge } from '../../../shared/estado-badge/estado-badge';

@Component({
  imports: [RouterLink, AlertaError, DiagramaCanvas, EstadoBadge],
  selector: 'app-compartido-visor',
  styleUrl: './compartido-visor.css',
  templateUrl: './compartido-visor.html',
})
export class CompartidoVisor {
  private readonly router = inject(Router);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly datos = signal<ProcesoCompartidoDetalleResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly seleccion = signal<Seleccion>(null);
  readonly arbol = computed(() => {
    const d = this.datos();
    return d ? armarArbol(d) : [];
  });

  constructor() {
    if (!Number.isInteger(this.id)) {
      void this.router.navigate(['/compartidos']);
      return;
    }
    inject(CompartidosService)
      .detalle(this.id)
      .subscribe({
        next: (datos) => this.datos.set(datos),
        error: (err: unknown) => this.error.set(detalleError(err)),
      });
  }
}
