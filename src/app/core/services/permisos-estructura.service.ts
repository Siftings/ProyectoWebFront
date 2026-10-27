// Permisos de estructura (pools y lanes) por rol, solo administrador: listar los 3 roles y guardar uno.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { RolAcceso } from '../../models/enums';
import { PermisoEstructuraRequest, PermisoEstructuraResponse } from '../../models/permisos';

@Injectable({ providedIn: 'root' })
export class PermisosEstructuraService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private get url(): string {
    return `${this.config.apiUrl}/permisos-estructura`;
  }

  listar(): Observable<PermisoEstructuraResponse[]> {
    return this.http.get<PermisoEstructuraResponse[]>(this.url);
  }

  actualizar(rol: RolAcceso, req: PermisoEstructuraRequest): Observable<PermisoEstructuraResponse> {
    const cuerpo: PermisoEstructuraRequest = {
      crearPool: req.crearPool,
      editarPool: req.editarPool,
      eliminarPool: req.eliminarPool,
      crearLane: req.crearLane,
      editarLane: req.editarLane,
      eliminarLane: req.eliminarLane,
    };
    return this.http.put<PermisoEstructuraResponse>(`${this.url}/${rol}`, cuerpo);
  }
}
