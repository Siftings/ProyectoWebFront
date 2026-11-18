import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { EmpresaResponse, UsuarioResponse } from '../../models/auth';
import { Registro } from './registro';

const EMPRESA: EmpresaResponse = {
  id: 3,
  nombre: 'Acme',
  nit: '900123',
  correoContacto: 'contacto@acme.com',
  fechaRegistro: '2026-10-26T10:00:00',
};

const ADMIN: UsuarioResponse = {
  id: 9,
  nombre: 'Ana',
  email: 'ana@acme.com',
  rolAcceso: 'ADMINISTRADOR',
  activo: true,
};

function crear(
  registrar: ReturnType<typeof vi.fn>,
  login: ReturnType<typeof vi.fn> = vi.fn(() => of(ADMIN)),
) {
  TestBed.configureTestingModule({
    imports: [Registro],
    providers: [
      provideRouter([]),
      { provide: EmpresasService, useValue: { registrar } },
      { provide: AuthService, useValue: { login } },
    ],
  });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(Registro);
  fixture.detectChanges();
  return { fixture, navigate };
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
    const componente = crear(registrar).fixture.componentInstance;
    componente.enviar();
    expect(registrar).not.toHaveBeenCalled();
    expect(componente.form.controls.nit.touched).toBe(true);
  });

  it('exige una contraseña de al menos 8 caracteres', () => {
    const componente = crear(vi.fn()).fixture.componentInstance;
    componente.form.controls.passwordAdmin.setValue('1234567');
    expect(componente.form.controls.passwordAdmin.hasError('minlength')).toBe(true);
  });

  it('recorta los campos menos la contraseña, inicia sesión y va al inicio', () => {
    const registrar = vi.fn(() => of(EMPRESA));
    const login = vi.fn(() => of(ADMIN));
    const { fixture, navigate } = crear(registrar, login);
    const componente = fixture.componentInstance;
    llenar(componente);

    componente.enviar();

    expect(registrar).toHaveBeenCalledWith({
      nombreEmpresa: 'Acme',
      nit: '900123',
      correoContacto: 'contacto@acme.com',
      nombreAdmin: 'Ana',
      emailAdmin: 'ana@acme.com',
      passwordAdmin: ' secreta123',
    });
    expect(login).toHaveBeenCalledWith({ email: 'ana@acme.com', password: ' secreta123' });
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('si el login automático falla lleva al login con el correo puesto', () => {
    const login = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 401 })));
    const { fixture, navigate } = crear(vi.fn(() => of(EMPRESA)), login);
    const componente = fixture.componentInstance;
    llenar(componente);

    componente.enviar();

    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { email: 'ana@acme.com' } });
    expect(componente.error()).toBeNull();
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
    const login = vi.fn();
    const { fixture } = crear(registrar, login);
    const componente = fixture.componentInstance;
    llenar(componente);

    componente.enviar();
    fixture.detectChanges();

    expect(componente.error()).toBe(detail);
    expect(componente.enviando()).toBe(false);
    expect(login).not.toHaveBeenCalled();
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
    const componente = crear(registrar).fixture.componentInstance;
    llenar(componente);
    componente.enviar();
    expect(componente.erroresCampo()).toEqual({ nit: 'El NIT es obligatorio.' });
    expect(componente.error()).toBeNull();
  });

  it('un campo con solo espacios es inválido', () => {
    const componente = crear(vi.fn()).fixture.componentInstance;
    componente.form.controls.nit.setValue('   ');
    expect(componente.form.controls.nit.invalid).toBe(true);
  });
});
