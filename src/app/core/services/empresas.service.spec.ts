import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { EmpresaResponse, EmpresaResumenResponse, RegistroEmpresaRequest } from '../../models/auth';
import { EmpresasService } from './empresas.service';

const SOLICITUD: RegistroEmpresaRequest = {
  nombreEmpresa: 'Acme',
  nit: '900123',
  correoContacto: 'contacto@acme.com',
  nombreAdmin: 'Ana',
  emailAdmin: 'ana@acme.com',
  passwordAdmin: 'secreta123',
};

const RESPUESTA: EmpresaResponse = {
  id: 3,
  nombre: 'Acme',
  nit: '900123',
  correoContacto: 'contacto@acme.com',
  fechaRegistro: '2026-10-26T10:00:00',
};

describe('EmpresasService', () => {
  let servicio: EmpresasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(EmpresasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registrar hace POST /empresas con la solicitud y devuelve la empresa', () => {
    let recibida: EmpresaResponse | undefined;
    servicio.registrar(SOLICITUD).subscribe((e) => (recibida = e));

    const req = http.expectOne('http://api/empresas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(SOLICITUD);
    req.flush(RESPUESTA);

    expect(recibida).toEqual(RESPUESTA);
  });

  it('buscarPorNit hace GET /empresas con el NIT como query', () => {
    let recibida: EmpresaResumenResponse | undefined;
    servicio.buscarPorNit('900654321-2').subscribe((e) => (recibida = e));

    const req = http.expectOne((r) => r.url === 'http://api/empresas');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('nit')).toBe('900654321-2');
    req.flush({ id: 2, nombre: 'Empresa Beta S.A.S.' });

    expect(recibida).toEqual({ id: 2, nombre: 'Empresa Beta S.A.S.' });
  });
});
