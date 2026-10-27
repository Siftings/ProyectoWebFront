import { TestBed } from '@angular/core/testing';
import { AlertaError } from './alerta-error';

function crear(mensaje: string | null) {
  const fixture = TestBed.createComponent(AlertaError);
  fixture.componentRef.setInput('mensaje', mensaje);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('AlertaError', () => {
  it('muestra el mensaje con role alert', () => {
    const alerta = crear('Ya existe un proceso con ese nombre.').querySelector('.alerta-error');
    expect(alerta?.getAttribute('role')).toBe('alert');
    expect(alerta?.textContent).toContain('Ya existe un proceso con ese nombre.');
  });

  it('no pinta nada sin mensaje', () => {
    expect(crear(null).querySelector('.alerta')).toBeNull();
  });
});
