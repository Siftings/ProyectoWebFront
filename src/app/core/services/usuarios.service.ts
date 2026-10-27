// Usuarios de la empresa (solo administrador): listar, crear, actualizar rol o estado y desactivar.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { ActualizarUsuarioRequest, CrearUsuarioRequest, UsuarioResponse } from '../../models/auth';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private get url(): string {
    return `${this.config.apiUrl}/usuarios`;
  }

  listar(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.url);
  }

  obtener(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.url}/${id}`);
  }

  crear(req: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.url, req);
  }

  actualizar(id: number, req: ActualizarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${this.url}/${id}`, req);
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
