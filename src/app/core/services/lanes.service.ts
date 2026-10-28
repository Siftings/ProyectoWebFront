// Lanes de un pool: alta, edición, baja lógica y reordenamiento.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { LaneRequest, LaneResponse, ReordenarLanesRequest } from '../../models/pool-lane';

@Injectable({ providedIn: 'root' })
export class LanesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  crear(poolId: number, req: LaneRequest): Observable<LaneResponse> {
    return this.http.post<LaneResponse>(`${this.config.apiUrl}/pools/${poolId}/lanes`, req);
  }

  editar(id: number, req: LaneRequest): Observable<LaneResponse> {
    return this.http.put<LaneResponse>(`${this.config.apiUrl}/lanes/${id}`, req);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/lanes/${id}`);
  }

  reordenar(poolId: number, laneIds: number[]): Observable<LaneResponse[]> {
    const req: ReordenarLanesRequest = { laneIds };
    return this.http.patch<LaneResponse[]>(
      `${this.config.apiUrl}/pools/${poolId}/lanes/orden`,
      req,
    );
  }
}
