// Roles de proceso: listado paginado con filtro por nombre, detalle, alta, edición y baja lógica.
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { PageResponse } from '../../models/comun';
import {
  RolProcesoConsultaResponse,
  RolProcesoRequest,
  RolProcesoVistaResponse,
} from '../../models/rol-proceso';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private get url(): string {
    return `${this.config.apiUrl}/roles`;
  }

  listar(nombre: string, pagina: number): Observable<PageResponse<RolProcesoConsultaResponse>> {
    let params = new HttpParams().set('pagina', pagina);
    if (nombre) {
      params = params.set('nombre', nombre);
    }
    return this.http.get<PageResponse<RolProcesoConsultaResponse>>(`${this.url}/consulta`, { params });
  }

  obtener(id: number): Observable<RolProcesoVistaResponse> {
    return this.http.get<RolProcesoVistaResponse>(`${this.url}/${id}`);
  }

  crear(req: RolProcesoRequest): Observable<RolProcesoVistaResponse> {
    return this.http.post<RolProcesoVistaResponse>(this.url, req);
  }

  editar(id: number, req: RolProcesoRequest): Observable<RolProcesoVistaResponse> {
    return this.http.put<RolProcesoVistaResponse>(`${this.url}/${id}`, req);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
