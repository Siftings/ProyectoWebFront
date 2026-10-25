// Carga config.json antes de arrancar la app y expone la URL del API.
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  apiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private config: AppConfig | null = null;

  get apiUrl(): string {
    if (!this.config) {
      throw new Error('La configuración aún no se ha cargado.');
    }
    return this.config.apiUrl;
  }

  async load(): Promise<void> {
    const config = await firstValueFrom(this.http.get<Partial<AppConfig>>('config.json'));
    if (typeof config?.apiUrl !== 'string' || config.apiUrl.trim() === '') {
      throw new Error('config.json debe incluir "apiUrl".');
    }
    this.config = { apiUrl: config.apiUrl.trim().replace(/\/+$/, '') };
  }
}
