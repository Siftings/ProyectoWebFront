// Carga config.json antes de arrancar la app y expone la URL del API y el usuario fijo.
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ETIQUETAS_ROL_ACCESO, RolAcceso } from '../../models/enums';

export interface UsuarioFijo {
  email: string;
  rolAcceso: RolAcceso;
}

export interface AppConfig {
  apiUrl: string;
  usuarioFijo: UsuarioFijo;
}

function esUsuarioFijo(valor: unknown): valor is UsuarioFijo {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const candidato = valor as Partial<Record<keyof UsuarioFijo, unknown>>;
  return (
    typeof candidato.email === 'string' &&
    candidato.email.trim() !== '' &&
    typeof candidato.rolAcceso === 'string' &&
    Object.hasOwn(ETIQUETAS_ROL_ACCESO, candidato.rolAcceso)
  );
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private config: AppConfig | null = null;

  get apiUrl(): string {
    return this.cargada().apiUrl;
  }

  get usuarioFijo(): UsuarioFijo {
    return this.cargada().usuarioFijo;
  }

  async load(): Promise<void> {
    const config = await firstValueFrom(this.http.get<Partial<AppConfig>>('config.json'));
    if (typeof config?.apiUrl !== 'string' || config.apiUrl.trim() === '') {
      throw new Error('config.json debe incluir "apiUrl".');
    }
    if (!esUsuarioFijo(config.usuarioFijo)) {
      throw new Error('config.json debe incluir "usuarioFijo" con "email" y un "rolAcceso" válido.');
    }
    this.config = {
      apiUrl: config.apiUrl.trim().replace(/\/+$/, ''),
      usuarioFijo: { email: config.usuarioFijo.email.trim(), rolAcceso: config.usuarioFijo.rolAcceso },
    };
  }

  private cargada(): AppConfig {
    if (!this.config) {
      throw new Error('La configuración aún no se ha cargado.');
    }
    return this.config;
  }
}
