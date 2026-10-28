import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { LaneResponse } from '../../models/pool-lane';
import { LanesService } from './lanes.service';

const LANE: LaneResponse = {
  id: 7,
  nombre: 'Ventas',
  orden: 0,
  poolId: 4,
  rolProcesoId: 3,
  rolProcesoNombre: 'Analista',
};

describe('LanesService', () => {
  let servicio: LanesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(LanesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear hace POST en el pool con el cuerpo', () => {
    servicio.crear(4, { nombre: 'Ventas', rolProcesoId: 3 }).subscribe();

    const req = http.expectOne('http://api/pools/4/lanes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Ventas', rolProcesoId: 3 });
    req.flush(LANE);
  });

  it('editar hace PUT con el cuerpo', () => {
    servicio.editar(7, { nombre: 'Ventas', rolProcesoId: 5 }).subscribe();

    const req = http.expectOne('http://api/lanes/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nombre: 'Ventas', rolProcesoId: 5 });
    req.flush(LANE);
  });

  it('eliminar hace DELETE', () => {
    servicio.eliminar(7).subscribe();

    const req = http.expectOne('http://api/lanes/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('reordenar hace PATCH con la lista completa de ids', () => {
    servicio.reordenar(4, [9, 7, 8]).subscribe();

    const req = http.expectOne('http://api/pools/4/lanes/orden');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ laneIds: [9, 7, 8] });
    req.flush([LANE]);
  });
});
