// Nodos del diagrama (actividades, gateways y eventos de mensaje): alta, edición, baja lógica e impacto de eliminación.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { ImpactoEliminacionResponse } from '../../models/comun';
import {
  ActividadRequest,
  ActividadResponse,
  EventoMensajeRequest,
  EventoMensajeResponse,
  GatewayRequest,
  GatewayResponse,
} from '../../models/nodo';

export interface RequestNodo {
  actividad: ActividadRequest;
  gateway: GatewayRequest;
  evento: EventoMensajeRequest;
}

export interface ResponseNodo {
  actividad: ActividadResponse;
  gateway: GatewayResponse;
  evento: EventoMensajeResponse;
}

export type KindNodo = keyof RequestNodo;

const RUTAS: Record<KindNodo, string> = {
  actividad: 'actividades',
  gateway: 'gateways',
  evento: 'eventos-mensaje',
};

@Injectable({ providedIn: 'root' })
export class NodosService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  crear<K extends KindNodo>(
    kind: K,
    laneId: number,
    req: RequestNodo[K],
  ): Observable<ResponseNodo[K]> {
    return this.http.post<ResponseNodo[K]>(
      `${this.config.apiUrl}/lanes/${laneId}/${RUTAS[kind]}`,
      req,
    );
  }

  editar<K extends KindNodo>(
    kind: K,
    id: number,
    req: RequestNodo[K],
  ): Observable<ResponseNodo[K]> {
    return this.http.put<ResponseNodo[K]>(`${this.config.apiUrl}/${RUTAS[kind]}/${id}`, req);
  }

  eliminar(kind: KindNodo, id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/${RUTAS[kind]}/${id}`);
  }

  impacto(kind: 'actividad' | 'gateway', id: number): Observable<ImpactoEliminacionResponse> {
    return this.http.get<ImpactoEliminacionResponse>(
      `${this.config.apiUrl}/${RUTAS[kind]}/${id}/impacto-eliminacion`,
    );
  }
}
