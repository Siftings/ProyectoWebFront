import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EmpresasService } from '../../core/services/empresas.service';
import { EmpresaResponse } from '../../models/auth';
import { Registro } from './registro';

const EMPRESA: EmpresaResponse = {
  id: 3,
  nombre: 'Acme',
  nit: '900123',
  correoContacto: 'contacto@acme.com',
  fechaRegistro: '2026-10-26T10:00:00',
};

function crear(registrar: ReturnType<typeof vi.fn>) {
  TestBed.configureTestingModule({
    imports: [Registro],
    providers: [{ provide: EmpresasService, useValue: { registrar } }],
  });
  const fixture = TestBed.createComponent(Registro);
  fixture.detectChanges();
  return fixture;
}

function llenar(componente: Registro): void {
  componente.form.setValue({
    nombreEmpresa: ' Acme ',
    nit: ' 900123 ',
    correoContacto: 'contacto@acme.com',
    nombreAdmin: 'Ana',
    emailAdmin: 'ana@acme.com',
    passwordAdmin: ' secreta123',
  });
}

describe('Registro', () => {
  it('no envía si el formulario es inválido', () => {
    const registrar = vi.fn();
    const componente = crear(registrar).componentInstance;
    componente.enviar();
    expect(registrar).not.toHaveBeenCalled();
    expect(componente.form.controls.nit.touched).toBe(true);
  });

  it('exige una contraseña de al menos 8 caracteres', () => {
    const componente = crear(vi.fn()).componentInstance;
    componente.form.controls.passwordAdmin.setValue('1234567');
    expect(componente.form.controls.passwordAdmin.hasError('minlength')).toBe(true);
  });

  it('recorta los campos menos la contraseña, muestra el aviso y vacía el formulario', () => {
    const registrar = vi.fn(() => of(EMPRESA));
    const fixture = crear(registrar);
    const componente = fixture.componentInstance;
    llenar(componente);

    componente.enviar();
    fixture.detectChanges();

    expect(registrar).toHaveBeenCalledWith({
      nombreEmpresa: 'Acme',
      nit: '900123',
      correoContacto: 'contacto@acme.com',
      nombreAdmin: 'Ana',
      emailAdmin: 'ana@acme.com',
      passwordAdmin: ' secreta123',
    });
    expect(componente.creada()).toEqual({ nombre: 'Acme', nit: '900123', emailAdmin: 'ana@acme.com' });
    expect(componente.form.getRawValue().nit).toBe('');
    const aviso = (fixture.nativeElement as HTMLElement).querySelector('.alerta-exito');
    expect(aviso?.textContent).toContain('Empresa Acme registrada (NIT 900123)');
    expect(componente.enviando()).toBe(false);
  });

  it('un 409 muestra el detail del backend', () => {
    const detail = 'Ya existe una empresa registrada con el NIT 900123.';
    const registrar = vi.fn(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { type: 'about:blank', title: 'Conflicto', status: 409, detail, instance: '/api/v1/empresas' },
          }),
      ),
    );
    const fixture = crear(registrar);
    const componente = fixture.componentInstance;
    llenar(componente);

    componente.enviar();
    fixture.detectChanges();

    expect(componente.error()).toBe(detail);
    expect(componente.creada()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.alerta-error')?.textContent).toContain(detail);
  });

  it('un 400 reparte los errores por campo', () => {
    const registrar = vi.fn(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              type: 'about:blank',
              title: 'Validación fallida',
              status: 400,
              detail: 'nit: El NIT es obligatorio.',
              instance: '/api/v1/empresas',
            },
          }),
      ),
    );
    const componente = crear(registrar).componentInstance;
    llenar(componente);
    componente.enviar();
    expect(componente.erroresCampo()).toEqual({ nit: 'El NIT es obligatorio.' });
    expect(componente.error()).toBeNull();
  });

  it('un campo con solo espacios es inválido', () => {
    const componente = crear(vi.fn()).componentInstance;
    componente.form.controls.nit.setValue('   ');
    expect(componente.form.controls.nit.invalid).toBe(true);
  });
});
