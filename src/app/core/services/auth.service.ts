// Sesión del usuario: login, logout y estado en signals persistido en localStorage.
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { LoginRequest, LoginResponse, UsuarioResponse } from '../../models/auth';

interface Sesion {
  token: string;
  usuario: UsuarioResponse;
  expiraEn: number;
}

const CLAVE = 'sesion';

function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const candidato = valor as Partial<Record<keyof Sesion, unknown>>;
  const usuario = candidato.usuario as Partial<UsuarioResponse> | null | undefined;
  return (
    typeof candidato.token === 'string' &&
    typeof candidato.expiraEn === 'number' &&
    typeof usuario === 'object' &&
    usuario !== null &&
    typeof usuario.rolAcceso === 'string'
  );
}

function borrarSesionGuardada(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {}
}

function guardarSesion(sesion: Sesion): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch {}
}

function leerSesionGuardada(): Sesion | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo === null) {
      return null;
    }
    const sesion: unknown = JSON.parse(crudo);
    if (esSesion(sesion) && Date.now() < sesion.expiraEn) {
      return sesion;
    }
  } catch {}
  borrarSesionGuardada();
  return null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly sesion = signal<Sesion | null>(leerSesionGuardada());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly rol = computed(() => this.usuario()?.rolAcceso ?? null);
  readonly esAdmin = computed(() => this.rol() === 'ADMINISTRADOR');
  readonly puedeEditar = computed(() => this.rol() === 'ADMINISTRADOR' || this.rol() === 'EDITOR');

  token(): string | null {
    const sesion = this.sesion();
    if (sesion === null) {
      return null;
    }
    if (Date.now() >= sesion.expiraEn) {
      this.limpiar();
      return null;
    }
    return sesion.token;
  }

  haySesion(): boolean {
    return this.token() !== null;
  }

  login(req: LoginRequest): Observable<UsuarioResponse> {
    return this.http.post<LoginResponse>(`${this.config.apiUrl}/auth/login`, req).pipe(
      tap((resp) => {
        const sesion: Sesion = {
          token: resp.accessToken,
          usuario: resp.usuario,
          expiraEn: Date.now() + resp.expiresIn * 1000,
        };
        this.sesion.set(sesion);
        guardarSesion(sesion);
      }),
      map((resp) => resp.usuario),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.config.apiUrl}/auth/logout`, null).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      tap(() => this.limpiar()),
    );
  }

  limpiar(): void {
    this.sesion.set(null);
    borrarSesionGuardada();
  }
}
