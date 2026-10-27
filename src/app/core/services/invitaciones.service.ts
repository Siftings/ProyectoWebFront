// Invitaciones de usuario: aceptar una invitación con su token.
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { AceptarInvitacionRequest, UsuarioResponse } from '../../models/auth';

@Injectable({ providedIn: 'root' })
export class InvitacionesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  aceptar(token: string, req: AceptarInvitacionRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(
      `${this.config.apiUrl}/usuarios/invitaciones/${encodeURIComponent(token)}/aceptar`,
      req,
    );
  }
}
