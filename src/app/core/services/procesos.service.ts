// Procesos: listado paginado con filtros, detalle, diagrama, alta, edición, publicación y baja lógica.
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { PageResponse } from '../../models/comun';
import { EstadoProceso } from '../../models/enums';
import {
  CambiarEstadoProcesoRequest,
  ProcesoDetalleResponse,
  ProcesoDiagramaResponse,
  ProcesoRequest,
  ProcesoResponse,
} from '../../models/proceso';

export interface FiltrosProceso {
  nombre?: string;
  estado?: EstadoProceso;
  categoria?: string;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProcesosService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private get url(): string {
    return `${this.config.apiUrl}/procesos`;
  }

  listar(filtros: FiltrosProceso, pagina: number): Observable<PageResponse<ProcesoResponse>> {
    let params = new HttpParams().set('pagina', pagina);
    if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.categoria) {
      params = params.set('categoria', filtros.categoria);
    }
    if (filtros.activo !== undefined) {
      params = params.set('activo', filtros.activo);
    }
    return this.http.get<PageResponse<ProcesoResponse>>(this.url, { params });
  }

  obtener(id: number): Observable<ProcesoDetalleResponse> {
    return this.http.get<ProcesoDetalleResponse>(`${this.url}/${id}`);
  }

  diagrama(id: number): Observable<ProcesoDiagramaResponse> {
    return this.http.get<ProcesoDiagramaResponse>(`${this.url}/${id}/diagrama`);
  }

  crear(req: ProcesoRequest): Observable<ProcesoResponse> {
    return this.http.post<ProcesoResponse>(this.url, req);
  }

  editar(id: number, req: ProcesoRequest): Observable<ProcesoResponse> {
    return this.http.put<ProcesoResponse>(`${this.url}/${id}`, req);
  }

  publicar(id: number): Observable<ProcesoResponse> {
    const req: CambiarEstadoProcesoRequest = { estado: 'PUBLICADO' };
    return this.http.patch<ProcesoResponse>(`${this.url}/${id}`, req);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
