import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { PageResponse } from '../../models/comun';
import { ProcesoRequest, ProcesoResponse } from '../../models/proceso';
import { ProcesosService } from './procesos.service';

const PROCESO: ProcesoResponse = {
  id: 4,
  nombre: 'Compras',
  descripcion: 'Flujo de compras',
  categoria: 'Finanzas',
  estado: 'BORRADOR',
  activo: true,
  fechaCreacion: '2026-10-26T10:00:00',
  fechaModificacion: '2026-10-26T10:00:00',
};

const SOLICITUD: ProcesoRequest = {
  nombre: 'Compras',
  descripcion: 'Flujo de compras',
  categoria: 'Finanzas',
};

describe('ProcesosService', () => {
  let servicio: ProcesosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(ProcesosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar manda solo la página cuando no hay filtros', () => {
    servicio.listar({}, 0).subscribe();

    const req = http.expectOne((r) => r.url === 'http://api/procesos');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual(['pagina']);
    expect(req.request.params.get('pagina')).toBe('0');
    req.flush({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('listar manda los filtros definidos, incluido activo=false, y omite los vacíos', () => {
    let recibida: PageResponse<ProcesoResponse> | undefined;
    servicio
      .listar({ nombre: 'comp', estado: 'PUBLICADO', categoria: '', activo: false }, 2)
      .subscribe((p) => (recibida = p));

    const req = http.expectOne((r) => r.url === 'http://api/procesos');
    expect(req.request.params.get('nombre')).toBe('comp');
    expect(req.request.params.get('estado')).toBe('PUBLICADO');
    expect(req.request.params.get('activo')).toBe('false');
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.has('categoria')).toBe(false);
    const pagina = { content: [PROCESO], page: 2, size: 10, totalElements: 21, totalPages: 3 };
    req.flush(pagina);

    expect(recibida).toEqual(pagina);
  });

  it('obtener hace GET /procesos/{id}', () => {
    servicio.obtener(4).subscribe();
    const req = http.expectOne('http://api/procesos/4');
    expect(req.request.method).toBe('GET');
    req.flush({ proceso: PROCESO, historial: [] });
  });

  it('diagrama hace GET /procesos/{id}/diagrama', () => {
    servicio.diagrama(4).subscribe();
    const req = http.expectOne('http://api/procesos/4/diagrama');
    expect(req.request.method).toBe('GET');
    req.flush({
      proceso: PROCESO,
      pools: [],
      lanes: [],
      actividades: [],
      gateways: [],
      eventos: [],
      arcos: [],
      mensajes: [],
    });
  });

  it('crear hace POST /procesos con la solicitud', () => {
    servicio.crear(SOLICITUD).subscribe();
    const req = http.expectOne('http://api/procesos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(SOLICITUD);
    req.flush(PROCESO);
  });

  it('editar hace PUT /procesos/{id} con la solicitud', () => {
    servicio.editar(4, SOLICITUD).subscribe();
    const req = http.expectOne('http://api/procesos/4');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(SOLICITUD);
    req.flush(PROCESO);
  });

  it('publicar hace PATCH con el estado PUBLICADO', () => {
    servicio.publicar(4).subscribe();
    const req = http.expectOne('http://api/procesos/4');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'PUBLICADO' });
    req.flush({ ...PROCESO, estado: 'PUBLICADO' });
  });

  it('eliminar hace DELETE /procesos/{id}', () => {
    servicio.eliminar(4).subscribe();
    const req = http.expectOne('http://api/procesos/4');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
