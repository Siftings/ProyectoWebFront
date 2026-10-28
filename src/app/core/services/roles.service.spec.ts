import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { PageResponse } from '../../models/comun';
import {
  RolProcesoConsultaResponse,
  RolProcesoRequest,
  RolProcesoVistaResponse,
} from '../../models/rol-proceso';
import { RolesService } from './roles.service';

const VISTA: RolProcesoVistaResponse = {
  id: 3,
  nombre: 'Analista',
  descripcion: null,
  procesosQueLoUsan: 0,
  enUso: false,
};

const SOLICITUD: RolProcesoRequest = { nombre: 'Analista', descripcion: 'Revisa solicitudes' };

describe('RolesService', () => {
  let servicio: RolesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(RolesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar manda pagina y nombre, y devuelve la página', () => {
    const pagina: PageResponse<RolProcesoConsultaResponse> = {
      content: [],
      page: 1,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    };
    let recibida: PageResponse<RolProcesoConsultaResponse> | undefined;
    servicio.listar('anal', 1).subscribe((r) => (recibida = r));

    const req = http.expectOne((r) => r.url === 'http://api/roles/consulta');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('pagina')).toBe('1');
    expect(req.request.params.get('nombre')).toBe('anal');
    req.flush(pagina);
    expect(recibida).toEqual(pagina);
  });

  it('listar omite el nombre vacío', () => {
    servicio.listar('', 0).subscribe();

    const req = http.expectOne((r) => r.url === 'http://api/roles/consulta');
    expect(req.request.params.get('pagina')).toBe('0');
    expect(req.request.params.has('nombre')).toBe(false);
    req.flush({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('todos pide la lista completa de roles activos', () => {
    servicio.todos().subscribe();

    const req = http.expectOne('http://api/roles');
    expect(req.request.method).toBe('GET');
    req.flush([VISTA]);
  });

  it('obtener pide el rol por id', () => {
    servicio.obtener(3).subscribe();

    const req = http.expectOne('http://api/roles/3');
    expect(req.request.method).toBe('GET');
    req.flush(VISTA);
  });

  it('crear hace POST con el cuerpo', () => {
    servicio.crear(SOLICITUD).subscribe();

    const req = http.expectOne('http://api/roles');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(SOLICITUD);
    req.flush(VISTA);
  });

  it('editar hace PUT con el cuerpo', () => {
    servicio.editar(3, SOLICITUD).subscribe();

    const req = http.expectOne('http://api/roles/3');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(SOLICITUD);
    req.flush(VISTA);
  });

  it('eliminar hace DELETE', () => {
    servicio.eliminar(3).subscribe();

    const req = http.expectOne('http://api/roles/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
