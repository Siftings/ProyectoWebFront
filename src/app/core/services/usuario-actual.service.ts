// Usuario actual de la entrega sin JWT: el usuario fijo de config.json y su rol en signals.
import { Injectable, computed, inject, signal } from '@angular/core';
import { ConfigService, UsuarioFijo } from '../config/config.service';

@Injectable({ providedIn: 'root' })
export class UsuarioActualService {
  readonly usuario = signal<UsuarioFijo>(inject(ConfigService).usuarioFijo).asReadonly();
  readonly rol = computed(() => this.usuario().rolAcceso);
  readonly esAdmin = computed(() => this.rol() === 'ADMINISTRADOR');
  readonly puedeEditar = computed(() => this.rol() === 'ADMINISTRADOR' || this.rol() === 'EDITOR');
}
