// Empresas: registro de una empresa nueva con su administrador.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { EmpresaResponse, RegistroEmpresaRequest } from '../../models/auth';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  registrar(req: RegistroEmpresaRequest): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>(`${this.config.apiUrl}/empresas`, req);
  }
}
