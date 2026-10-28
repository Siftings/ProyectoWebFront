import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { CorrelacionesService } from './correlaciones.service';

describe('CorrelacionesService', () => {
  let servicio: CorrelacionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(CorrelacionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtener hace GET en la correlación del mensaje', () => {
    servicio.obtener(5).subscribe();

    const req = http.expectOne('http://api/mensajes/5/correlacion');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, criterio: 'idProceso', mensajeId: 5 });
  });

  it('guardar hace PUT con el criterio', () => {
    servicio.guardar(5, { criterio: 'idCaso' }).subscribe();

    const req = http.expectOne('http://api/mensajes/5/correlacion');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ criterio: 'idCaso' });
    req.flush({});
  });

  it('eliminar hace DELETE', () => {
    servicio.eliminar(5).subscribe();

    const req = http.expectOne('http://api/mensajes/5/correlacion');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
