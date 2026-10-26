// Estructura de las pantallas con sesión: barra superior con menú según el rol y contenido.
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ETIQUETAS_ROL_ACCESO, RolAcceso } from '../../models/enums';
import { AuthService } from '../services/auth.service';

interface EnlaceMenu {
  texto: string;
  ruta: string;
  roles?: RolAcceso[];
}

const MENU: EnlaceMenu[] = [
  { texto: 'Procesos', ruta: '/procesos' },
  { texto: 'Compartidos conmigo', ruta: '/compartidos' },
  { texto: 'Roles de proceso', ruta: '/roles' },
  { texto: 'Usuarios', ruta: '/usuarios', roles: ['ADMINISTRADOR'] },
  { texto: 'Permisos', ruta: '/permisos', roles: ['ADMINISTRADOR'] },
];

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-layout',
  styleUrl: './layout.css',
  templateUrl: './layout.html',
})
export class Layout {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly etiquetasRol = ETIQUETAS_ROL_ACCESO;

  protected readonly enlaces = computed(() => {
    const rol = this.auth.rol();
    return MENU.filter((e) => !e.roles || (rol !== null && e.roles.includes(rol)));
  });

  cerrarSesion(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
