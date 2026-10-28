import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { PoolResponse } from '../../models/pool-lane';
import { PoolsService } from './pools.service';

const POOL: PoolResponse = {
  id: 4,
  nombre: 'Cliente',
  tipoParticipante: 'CLIENTE',
  cajaNegra: false,
  orden: 1,
  procesoId: 2,
};

describe('PoolsService', () => {
  let servicio: PoolsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(PoolsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear hace POST en el proceso con el cuerpo', () => {
    const cuerpo = { nombre: 'Cliente', tipoParticipante: 'CLIENTE' as const, cajaNegra: false };
    servicio.crear(2, cuerpo).subscribe();

    const req = http.expectOne('http://api/procesos/2/pools');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cuerpo);
    req.flush(POOL);
  });

  it('editar hace PUT con el cuerpo', () => {
    const cuerpo = { nombre: 'Cliente', tipoParticipante: 'CLIENTE' as const, cajaNegra: true };
    servicio.editar(4, cuerpo).subscribe();

    const req = http.expectOne('http://api/pools/4');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(cuerpo);
    req.flush(POOL);
  });

  it('eliminar hace DELETE', () => {
    servicio.eliminar(4).subscribe();

    const req = http.expectOne('http://api/pools/4');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
