// Pools de un proceso: alta, edición y baja lógica.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { EditarPoolRequest, PoolRequest, PoolResponse } from '../../models/pool-lane';

@Injectable({ providedIn: 'root' })
export class PoolsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  crear(procesoId: number, req: PoolRequest): Observable<PoolResponse> {
    return this.http.post<PoolResponse>(`${this.config.apiUrl}/procesos/${procesoId}/pools`, req);
  }

  editar(id: number, req: EditarPoolRequest): Observable<PoolResponse> {
    return this.http.put<PoolResponse>(`${this.config.apiUrl}/pools/${id}`, req);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/pools/${id}`);
  }
}
