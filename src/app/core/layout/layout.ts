// Estructura de las pantallas: barra superior con menú según el rol del usuario fijo y contenido.
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ETIQUETAS_ROL_ACCESO, RolAcceso } from '../../models/enums';
import { UsuarioActualService } from '../services/usuario-actual.service';

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
  protected readonly usuarioActual = inject(UsuarioActualService);
  protected readonly etiquetasRol = ETIQUETAS_ROL_ACCESO;

  protected readonly enlaces = computed(() => {
    const rol = this.usuarioActual.rol();
    return MENU.filter((e) => !e.roles || e.roles.includes(rol));
  });
}
