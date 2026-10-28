// Mensajes entre pools: alta (modo completo), edición y baja lógica.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { EditarMensajeRequest, MensajeRequest, MensajeResponse } from '../../models/mensaje';

@Injectable({ providedIn: 'root' })
export class MensajesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  crear(procesoId: number, req: MensajeRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(
      `${this.config.apiUrl}/procesos/${procesoId}/mensajes`,
      req,
    );
  }

  editar(id: number, req: EditarMensajeRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.config.apiUrl}/mensajes/${id}`, req);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/mensajes/${id}`);
  }
}
