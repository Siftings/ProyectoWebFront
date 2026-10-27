// Paginador anterior/siguiente; la página es de base 0 y el padre decide qué hacer con la que se pide.
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-paginador',
  styleUrl: './paginador.css',
  templateUrl: './paginador.html',
})
export class Paginador {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly cambiar = output<number>();
}
