// Arcos del diagrama: alta, edición parcial, baja lógica e impacto de eliminación.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { ArcoRequest, ArcoResponse, EditarArcoRequest } from '../../models/arco';
import { ImpactoEliminacionResponse } from '../../models/comun';

@Injectable({ providedIn: 'root' })
export class ArcosService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  crear(req: ArcoRequest): Observable<ArcoResponse> {
    return this.http.post<ArcoResponse>(`${this.config.apiUrl}/arcos`, req);
  }

  editar(id: number, req: EditarArcoRequest): Observable<ArcoResponse> {
    return this.http.put<ArcoResponse>(`${this.config.apiUrl}/arcos/${id}`, req);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/arcos/${id}`);
  }

  impacto(id: number): Observable<ImpactoEliminacionResponse> {
    return this.http.get<ImpactoEliminacionResponse>(
      `${this.config.apiUrl}/arcos/${id}/impacto-eliminacion`,
    );
  }
}
