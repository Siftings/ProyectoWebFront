// Compartidos: empresas con acceso a un proceso propio y procesos que otras empresas compartieron con la mía.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import {
  CompartirProcesoRequest,
  ProcesoCompartidoDetalleResponse,
  ProcesoCompartidoResponse,
} from '../../models/compartido';

@Injectable({ providedIn: 'root' })
export class CompartidosService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  listar(procesoId: number): Observable<ProcesoCompartidoResponse[]> {
    return this.http.get<ProcesoCompartidoResponse[]>(
      `${this.config.apiUrl}/procesos/${procesoId}/compartidos`,
    );
  }

  compartir(procesoId: number, empresaInvitadaId: number): Observable<ProcesoCompartidoResponse> {
    const req: CompartirProcesoRequest = { empresaInvitadaId };
    return this.http.post<ProcesoCompartidoResponse>(
      `${this.config.apiUrl}/procesos/${procesoId}/compartidos`,
      req,
    );
  }

  revocar(procesoId: number, empresaInvitadaId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.config.apiUrl}/procesos/${procesoId}/compartidos/${empresaInvitadaId}`,
    );
  }

  recibidos(): Observable<ProcesoCompartidoResponse[]> {
    return this.http.get<ProcesoCompartidoResponse[]>(`${this.config.apiUrl}/procesos-compartidos`);
  }

  detalle(procesoId: number): Observable<ProcesoCompartidoDetalleResponse> {
    return this.http.get<ProcesoCompartidoDetalleResponse>(
      `${this.config.apiUrl}/procesos-compartidos/${procesoId}`,
    );
  }
}
