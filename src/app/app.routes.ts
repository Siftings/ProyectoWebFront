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
