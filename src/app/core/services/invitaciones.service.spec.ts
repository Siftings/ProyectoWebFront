import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { UsuarioResponse } from '../../models/auth';
import { InvitacionesService } from './invitaciones.service';

const RESPUESTA: UsuarioResponse = {
  id: 7,
  nombre: 'Nuevo',
  email: 'nuevo@demo.com',
  rolAcceso: 'EDITOR',
  activo: true,
};

describe('InvitacionesService', () => {
  let servicio: InvitacionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(InvitacionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('aceptar hace POST con el token en la ruta y devuelve el usuario', () => {
    let recibido: UsuarioResponse | undefined;
    servicio.aceptar('abc-123', { nombre: 'Nuevo', password: 'secreta123' }).subscribe((u) => (recibido = u));

    const req = http.expectOne('http://api/usuarios/invitaciones/abc-123/aceptar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Nuevo', password: 'secreta123' });
    req.flush(RESPUESTA);

    expect(recibido).toEqual(RESPUESTA);
  });

  it('crear hace POST con el cuerpo y devuelve la invitación', () => {
    const invitacion = {
      id: 1,
      email: 'nuevo@demo.com',
      rolAcceso: 'EDITOR' as const,
      token: 'abc-123',
      fechaExpiracion: '2026-10-29T10:00:00',
    };
    let recibida: unknown;
    servicio.crear({ email: 'nuevo@demo.com', rolAcceso: 'EDITOR' }).subscribe((i) => (recibida = i));

    const req = http.expectOne('http://api/usuarios/invitaciones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'nuevo@demo.com', rolAcceso: 'EDITOR' });
    req.flush(invitacion);

    expect(recibida).toEqual(invitacion);
  });

  it('codifica el token en la URL', () => {
    servicio.aceptar('a/b?c', { nombre: 'Nuevo', password: 'secreta123' }).subscribe();
    http.expectOne('http://api/usuarios/invitaciones/a%2Fb%3Fc/aceptar').flush(RESPUESTA);
  });
});
