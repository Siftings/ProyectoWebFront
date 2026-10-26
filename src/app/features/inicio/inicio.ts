// Pantalla de inicio provisional con el usuario fijo de la configuración.
import { Component, inject } from '@angular/core';
import { UsuarioActualService } from '../../core/services/usuario-actual.service';
import { ETIQUETAS_ROL_ACCESO } from '../../models/enums';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
})
export class Inicio {
  protected readonly usuarioActual = inject(UsuarioActualService);
  protected readonly etiquetasRol = ETIQUETAS_ROL_ACCESO;
}
