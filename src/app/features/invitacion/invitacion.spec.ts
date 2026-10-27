import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { InvitacionesService } from '../../core/services/invitaciones.service';
import { UsuarioResponse } from '../../models/auth';
import { Invitacion } from './invitacion';

const USUARIO: UsuarioResponse = {
  id: 7,
  nombre: 'Nuevo',
  email: 'nuevo@demo.com',
  rolAcceso: 'EDITOR',
  activo: true,
};

function crear(aceptar: ReturnType<typeof vi.fn>) {
  TestBed.configureTestingModule({
    imports: [Invitacion],
    providers: [
      { provide: InvitacionesService, useValue: { aceptar } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'tok-1' }) } } },
    ],
  });
  const fixture = TestBed.createComponent(Invitacion);
  fixture.detectChanges();
  return fixture;
}

describe('Invitacion', () => {
  it('no envía si el formulario es inválido', () => {
    const aceptar = vi.fn();
    const componente = crear(aceptar).componentInstance;
    componente.form.setValue({ nombre: 'Nuevo', password: '1234567' });
    componente.enviar();
    expect(aceptar).not.toHaveBeenCalled();
  });

  it('acepta con el token de la ruta y muestra el correo de la cuenta', () => {
    const aceptar = vi.fn(() => of(USUARIO));
    const fixture = crear(aceptar);
    const componente = fixture.componentInstance;
    componente.form.setValue({ nombre: ' Nuevo ', password: 'secreta123' });

    componente.enviar();
    fixture.detectChanges();

    expect(aceptar).toHaveBeenCalledWith('tok-1', { nombre: 'Nuevo', password: 'secreta123' });
    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('.alerta-exito')?.textContent).toContain('Cuenta creada para nuevo@demo.com.');
    expect(elemento.querySelector('form')).toBeNull();
  });

  it('un 404 muestra el detail del backend', () => {
    const detail = 'Invitacion no encontrada o ya utilizada.';
    const aceptar = vi.fn(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { type: 'about:blank', title: 'No encontrado', status: 404, detail, instance: '/x' },
          }),
      ),
    );
    const fixture = crear(aceptar);
    const componente = fixture.componentInstance;
    componente.form.setValue({ nombre: 'Nuevo', password: 'secreta123' });

    componente.enviar();
    fixture.detectChanges();

    expect(componente.error()).toBe(detail);
    expect(componente.creado()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.alerta-error')?.textContent).toContain(detail);
  });
});
