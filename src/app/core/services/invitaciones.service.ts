// Invitaciones de usuario: crearlas (administrador) y aceptarlas con su token.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import {
  AceptarInvitacionRequest,
  InvitacionUsuarioRequest,
  InvitacionUsuarioResponse,
  UsuarioResponse,
} from '../../models/auth';

@Injectable({ providedIn: 'root' })
export class InvitacionesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  crear(req: InvitacionUsuarioRequest): Observable<InvitacionUsuarioResponse> {
    return this.http.post<InvitacionUsuarioResponse>(`${this.config.apiUrl}/usuarios/invitaciones`, req);
  }

  aceptar(token: string, req: AceptarInvitacionRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(
      `${this.config.apiUrl}/usuarios/invitaciones/${encodeURIComponent(token)}/aceptar`,
      req,
    );
  }
}
