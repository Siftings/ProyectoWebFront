import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { ArcosService } from './arcos.service';

describe('ArcosService', () => {
  let servicio: ArcosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(ArcosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear hace POST en /arcos con el cuerpo', () => {
    servicio.crear({ origenId: 1, destinoId: 2, condicion: 'ok' }).subscribe();

    const req = http.expectOne('http://api/arcos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ origenId: 1, destinoId: 2, condicion: 'ok' });
    req.flush({});
  });

  it('editar hace PUT y manda la cadena vacía para borrar', () => {
    servicio.editar(5, { etiqueta: '', condicion: 'si' }).subscribe();

    const req = http.expectOne('http://api/arcos/5');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ etiqueta: '', condicion: 'si' });
    req.flush({});
  });

  it('eliminar hace DELETE', () => {
    servicio.eliminar(5).subscribe();

    const req = http.expectOne('http://api/arcos/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('impacto hace GET en impacto-eliminacion', () => {
    servicio.impacto(5).subscribe();

    const req = http.expectOne('http://api/arcos/5/impacto-eliminacion');
    expect(req.request.method).toBe('GET');
    req.flush({ requiereConfirmacion: false, rompeContinuidad: false, advertencias: [] });
  });
});
