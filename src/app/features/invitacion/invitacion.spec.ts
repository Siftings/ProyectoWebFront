import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
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
      provideRouter([]),
      { provide: InvitacionesService, useValue: { aceptar } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'tok-1' }) } } },
    ],
  });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(Invitacion);
  fixture.detectChanges();
  return { fixture, navigate };
}

describe('Invitacion', () => {
  it('no envía si el formulario es inválido', () => {
    const aceptar = vi.fn();
    const componente = crear(aceptar).fixture.componentInstance;
    componente.form.setValue({ nombre: 'Nuevo', password: '1234567' });
    componente.enviar();
    expect(aceptar).not.toHaveBeenCalled();
  });

  it('acepta con el token de la ruta y lleva al login con el correo de la cuenta', () => {
    const aceptar = vi.fn(() => of(USUARIO));
    const { fixture, navigate } = crear(aceptar);
    const componente = fixture.componentInstance;
    componente.form.setValue({ nombre: ' Nuevo ', password: 'secreta123' });

    componente.enviar();

    expect(aceptar).toHaveBeenCalledWith('tok-1', { nombre: 'Nuevo', password: 'secreta123' });
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { email: 'nuevo@demo.com' } });
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
    const { fixture, navigate } = crear(aceptar);
    const componente = fixture.componentInstance;
    componente.form.setValue({ nombre: 'Nuevo', password: 'secreta123' });

    componente.enviar();
    fixture.detectChanges();

    expect(componente.error()).toBe(detail);
    expect(navigate).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('.alerta-error')?.textContent).toContain(detail);
  });
});
