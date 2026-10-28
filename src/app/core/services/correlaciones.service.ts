// Correlación de un mensaje: consulta, alta o cambio (upsert) y baja.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { CorrelacionRequest, CorrelacionResponse } from '../../models/mensaje';

@Injectable({ providedIn: 'root' })
export class CorrelacionesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  obtener(mensajeId: number): Observable<CorrelacionResponse> {
    return this.http.get<CorrelacionResponse>(this.url(mensajeId));
  }

  guardar(mensajeId: number, req: CorrelacionRequest): Observable<CorrelacionResponse> {
    return this.http.put<CorrelacionResponse>(this.url(mensajeId), req);
  }

  eliminar(mensajeId: number): Observable<void> {
    return this.http.delete<void>(this.url(mensajeId));
  }

  private url(mensajeId: number): string {
    return `${this.config.apiUrl}/mensajes/${mensajeId}/correlacion`;
  }
}
