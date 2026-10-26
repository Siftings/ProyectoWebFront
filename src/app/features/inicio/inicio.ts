// Pantalla de inicio provisional con los datos de la sesión.
import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ETIQUETAS_ROL_ACCESO } from '../../models/enums';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
})
export class Inicio {
  protected readonly auth = inject(AuthService);
  protected readonly etiquetasRol = ETIQUETAS_ROL_ACCESO;
}
