import { TestBed } from '@angular/core/testing';
import { Paginador } from './paginador';

function crear(pagina: number, totalPaginas: number) {
  const fixture = TestBed.createComponent(Paginador);
  fixture.componentRef.setInput('pagina', pagina);
  fixture.componentRef.setInput('totalPaginas', totalPaginas);
  fixture.detectChanges();
  const raiz = fixture.nativeElement as HTMLElement;
  const emitidas: number[] = [];
  fixture.componentInstance.cambiar.subscribe((p) => emitidas.push(p));
  const botones = Array.from(raiz.querySelectorAll('button'));
  return { raiz, botones, emitidas };
}

describe('Paginador', () => {
  it('muestra la página en base 1', () => {
    expect(crear(1, 3).raiz.textContent).toContain('Página 2 de 3');
  });

  it('deshabilita Anterior en la primera página', () => {
    const { botones } = crear(0, 3);
    expect(botones[0].disabled).toBe(true);
    expect(botones[1].disabled).toBe(false);
  });

  it('deshabilita Siguiente en la última página', () => {
    const { botones } = crear(2, 3);
    expect(botones[0].disabled).toBe(false);
    expect(botones[1].disabled).toBe(true);
  });

  it('emite la página anterior y la siguiente', () => {
    const { botones, emitidas } = crear(1, 3);
    botones[0].click();
    botones[1].click();
    expect(emitidas).toEqual([0, 2]);
  });

  it('no pinta nada con una página o ninguna', () => {
    expect(crear(0, 1).raiz.querySelector('nav')).toBeNull();
    expect(crear(0, 0).raiz.querySelector('nav')).toBeNull();
  });
});
