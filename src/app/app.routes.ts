import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then((m) => m.Layout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'procesos',
        loadComponent: () =>
          import('./features/procesos/lista/procesos-lista').then((m) => m.ProcesosLista),
      },
      {
        path: 'procesos/nuevo',
        loadComponent: () =>
          import('./features/procesos/formulario/proceso-formulario').then(
            (m) => m.ProcesoFormulario,
          ),
      },
      {
        path: 'procesos/:id',
        loadComponent: () =>
          import('./features/procesos/detalle/proceso-detalle').then((m) => m.ProcesoDetalle),
      },
      {
        path: 'procesos/:id/editar',
        loadComponent: () =>
          import('./features/procesos/formulario/proceso-formulario').then(
            (m) => m.ProcesoFormulario,
          ),
      },
      {
        path: 'procesos/:id/diagrama',
        loadComponent: () => import('./features/editor/editor').then((m) => m.Editor),
      },
      {
        path: 'procesos/:id/compartir',
        loadComponent: () =>
          import('./features/procesos/compartir/proceso-compartir').then((m) => m.ProcesoCompartir),
      },
      {
        path: 'compartidos',
        loadComponent: () =>
          import('./features/compartidos/lista/compartidos-lista').then((m) => m.CompartidosLista),
      },
      {
        path: 'compartidos/:id',
        loadComponent: () =>
          import('./features/compartidos/visor/compartido-visor').then((m) => m.CompartidoVisor),
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/lista/roles-lista').then((m) => m.RolesLista),
      },
      {
        path: 'roles/nuevo',
        loadComponent: () =>
          import('./features/roles/formulario/rol-formulario').then((m) => m.RolFormulario),
      },
      {
        path: 'roles/:id/editar',
        loadComponent: () =>
          import('./features/roles/formulario/rol-formulario').then((m) => m.RolFormulario),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/usuarios/lista/usuarios-lista').then((m) => m.UsuariosLista),
      },
      {
        path: 'usuarios/nuevo',
        loadComponent: () =>
          import('./features/usuarios/formulario/usuario-formulario').then(
            (m) => m.UsuarioFormulario,
          ),
      },
      {
        path: 'usuarios/invitar',
        loadComponent: () =>
          import('./features/usuarios/invitar/usuario-invitar').then((m) => m.UsuarioInvitar),
      },
      {
        path: 'usuarios/:id/editar',
        loadComponent: () =>
          import('./features/usuarios/editar/usuario-editar').then((m) => m.UsuarioEditar),
      },
      {
        path: 'permisos',
        loadComponent: () =>
          import('./features/permisos/permisos-estructura').then((m) => m.PermisosEstructura),
      },
      {
        path: 'registro',
        loadComponent: () => import('./features/registro/registro').then((m) => m.Registro),
      },
      {
        path: 'invitacion/:token',
        loadComponent: () => import('./features/invitacion/invitacion').then((m) => m.Invitacion),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
