import { TestBed } from '@angular/core/testing';
import { ErrorCampo } from './error-campo';

function crear(mostrar: boolean, servidor?: string) {
  const fixture = TestBed.createComponent(ErrorCampo);
  fixture.componentRef.setInput('mostrar', mostrar);
  fixture.componentRef.setInput('mensaje', 'Ingresa el NIT.');
  fixture.componentRef.setInput('servidor', servidor);
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).querySelectorAll('.error-campo');
}

describe('ErrorCampo', () => {
  it('no pinta nada sin error local ni del servidor', () => {
    expect(crear(false)).toHaveLength(0);
  });

  it('muestra el error local', () => {
    const errores = crear(true);
    expect(errores).toHaveLength(1);
    expect(errores[0].textContent).toContain('Ingresa el NIT.');
  });

  it('muestra el error del servidor aunque no haya error local', () => {
    const errores = crear(false, 'El NIT es obligatorio.');
    expect(errores).toHaveLength(1);
    expect(errores[0].textContent).toContain('El NIT es obligatorio.');
  });

  it('muestra ambos a la vez', () => {
    expect(crear(true, 'El NIT es obligatorio.')).toHaveLength(2);
  });
});
