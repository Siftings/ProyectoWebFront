// Sesión del usuario: login, renovación, logout y estado en signals persistido en localStorage.
import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, defer, map, of, tap } from 'rxjs';
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
  private readonly router = inject(Router);
  private readonly sesion = signal<Sesion | null>(leerSesionGuardada());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly expiraEn = computed(() => this.sesion()?.expiraEn ?? null);
  readonly rol = computed(() => this.usuario()?.rolAcceso ?? null);
  readonly esAdmin = computed(() => this.rol() === 'ADMINISTRADOR');
  readonly puedeEditar = computed(() => this.rol() === 'ADMINISTRADOR' || this.rol() === 'EDITOR');

  constructor() {
    const sincronizar = (evento: StorageEvent): void => {
      if (evento.key !== CLAVE && evento.key !== null) {
        return;
      }
      const antes = this.usuario()?.id;
      this.sesion.set(leerSesionGuardada());
      const despues = this.usuario()?.id;
      if (antes !== undefined && despues === undefined) {
        this.irAlLogin();
      } else if (antes !== undefined && despues !== antes) {
        this.router.navigateByUrl('/');
      }
    };
    window.addEventListener('storage', sincronizar);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', sincronizar));
  }

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

  esUsuarioActual(id: number): boolean {
    return this.usuario()?.id === id;
  }

  login(req: LoginRequest): Observable<UsuarioResponse> {
    return this.abrirSesion(this.http.post<LoginResponse>(`${this.config.apiUrl}/auth/login`, req));
  }

  refrescar(): Observable<UsuarioResponse> {
    return this.abrirSesion(this.http.post<LoginResponse>(`${this.config.apiUrl}/auth/refresh`, null));
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

  cerrarPorVencimiento(): void {
    this.limpiar();
    this.irAlLogin();
  }

  private irAlLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private abrirSesion(respuesta: Observable<LoginResponse>): Observable<UsuarioResponse> {
    return defer(() => {
      const enviadaEn = Date.now();
      return respuesta.pipe(
        tap((resp) => {
          const sesion: Sesion = {
            token: resp.accessToken,
            usuario: resp.usuario,
            expiraEn: enviadaEn + resp.expiresIn * 1000,
          };
          this.sesion.set(sesion);
          guardarSesion(sesion);
        }),
        map((resp) => resp.usuario),
      );
    });
  }
}
