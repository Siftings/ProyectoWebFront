import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { NodosService } from './nodos.service';

describe('NodosService', () => {
  let servicio: NodosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(NodosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear una actividad hace POST en la lane', () => {
    servicio.crear('actividad', 7, { nombre: 'Revisar', posicionX: 40, posicionY: 40 }).subscribe();

    const req = http.expectOne('http://api/lanes/7/actividades');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Revisar', posicionX: 40, posicionY: 40 });
    req.flush({});
  });

  it('crear un gateway usa la ruta de gateways', () => {
    servicio.crear('gateway', 7, { nombre: 'Decide', tipoGateway: 'EXCLUSIVO' }).subscribe();

    const req = http.expectOne('http://api/lanes/7/gateways');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('crear un evento usa la ruta de eventos-mensaje', () => {
    servicio
      .crear('evento', 7, {
        nombre: 'Aviso',
        tipoEvento: 'THROW',
        contenido: 'hola',
        claveCorrelacion: 'k',
      })
      .subscribe();

    const req = http.expectOne('http://api/lanes/7/eventos-mensaje');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('editar hace PUT con el cuerpo en la ruta del tipo', () => {
    servicio.editar('gateway', 3, { nombre: 'Decide', tipoGateway: 'PARALELO' }).subscribe();

    const req = http.expectOne('http://api/gateways/3');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nombre: 'Decide', tipoGateway: 'PARALELO' });
    req.flush({});
  });

  it('eliminar hace DELETE en la ruta del tipo', () => {
    servicio.eliminar('evento', 5).subscribe();

    const req = http.expectOne('http://api/eventos-mensaje/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('impacto hace GET de impacto-eliminacion', () => {
    servicio.impacto('actividad', 9).subscribe();

    const req = http.expectOne('http://api/actividades/9/impacto-eliminacion');
    expect(req.request.method).toBe('GET');
    req.flush({ requiereConfirmacion: false, rompeContinuidad: false, advertencias: [] });
  });
});
