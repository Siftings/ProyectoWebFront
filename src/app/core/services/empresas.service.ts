// Empresas: registro de una empresa nueva con su administrador y búsqueda por NIT para compartir.
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { EmpresaResponse, EmpresaResumenResponse, RegistroEmpresaRequest } from '../../models/auth';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  registrar(req: RegistroEmpresaRequest): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>(`${this.config.apiUrl}/empresas`, req);
  }

  buscarPorNit(nit: string): Observable<EmpresaResumenResponse> {
    const params = new HttpParams().set('nit', nit);
    return this.http.get<EmpresaResumenResponse>(`${this.config.apiUrl}/empresas`, { params });
  }
}
