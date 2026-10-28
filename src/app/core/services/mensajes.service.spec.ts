import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { MensajesService } from './mensajes.service';

describe('MensajesService', () => {
  let servicio: MensajesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(MensajesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear hace POST en /procesos/{id}/mensajes con el cuerpo', () => {
    const cuerpo = {
      nombre: 'Pedido',
      contenido: 'datos',
      poolOrigenId: 1,
      poolDestinoId: 2,
      eventoThrowId: 3,
      eventoCatchId: 4,
    };
    servicio.crear(7, cuerpo).subscribe();

    const req = http.expectOne('http://api/procesos/7/mensajes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cuerpo);
    req.flush({});
  });

  it('editar hace PUT en /mensajes/{id}', () => {
    servicio.editar(5, { nombre: 'Pedido', contenido: 'nuevo' }).subscribe();

    const req = http.expectOne('http://api/mensajes/5');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nombre: 'Pedido', contenido: 'nuevo' });
    req.flush({});
  });

  it('eliminar hace DELETE', () => {
    servicio.eliminar(5).subscribe();

    const req = http.expectOne('http://api/mensajes/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
