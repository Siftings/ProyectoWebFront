import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { CrearUsuarioRequest, UsuarioResponse } from '../../models/auth';
import { UsuariosService } from './usuarios.service';

const USUARIO: UsuarioResponse = {
  id: 7,
  nombre: 'Nuevo',
  email: 'nuevo@demo.com',
  rolAcceso: 'EDITOR',
  activo: true,
};

const SOLICITUD: CrearUsuarioRequest = {
  nombre: 'Nuevo',
  email: 'nuevo@demo.com',
  password: 'secreta123',
  rolAcceso: 'EDITOR',
};

describe('UsuariosService', () => {
  let servicio: UsuariosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(UsuariosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar hace GET y devuelve el arreglo', () => {
    let recibidos: UsuarioResponse[] | undefined;
    servicio.listar().subscribe((u) => (recibidos = u));

    const req = http.expectOne('http://api/usuarios');
    expect(req.request.method).toBe('GET');
    req.flush([USUARIO]);
    expect(recibidos).toEqual([USUARIO]);
  });

  it('obtener pide el usuario por id', () => {
    servicio.obtener(7).subscribe();

    const req = http.expectOne('http://api/usuarios/7');
    expect(req.request.method).toBe('GET');
    req.flush(USUARIO);
  });

  it('crear hace POST con el cuerpo', () => {
    servicio.crear(SOLICITUD).subscribe();

    const req = http.expectOne('http://api/usuarios');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(SOLICITUD);
    req.flush(USUARIO);
  });

  it('actualizar hace PATCH con el cuerpo', () => {
    servicio.actualizar(7, { rolAcceso: 'SOLO_LECTURA', activo: true }).subscribe();

    const req = http.expectOne('http://api/usuarios/7');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ rolAcceso: 'SOLO_LECTURA', activo: true });
    req.flush(USUARIO);
  });

  it('desactivar hace DELETE', () => {
    servicio.desactivar(7).subscribe();

    const req = http.expectOne('http://api/usuarios/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
