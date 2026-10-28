import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { CompartidosService } from './compartidos.service';

describe('CompartidosService', () => {
  let servicio: CompartidosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(CompartidosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar hace GET en los compartidos del proceso', () => {
    servicio.listar(7).subscribe();

    const req = http.expectOne('http://api/procesos/7/compartidos');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('compartir hace POST con la empresa invitada', () => {
    servicio.compartir(7, 2).subscribe();

    const req = http.expectOne('http://api/procesos/7/compartidos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ empresaInvitadaId: 2 });
    req.flush({});
  });

  it('revocar hace DELETE con el id de la empresa', () => {
    servicio.revocar(7, 2).subscribe();

    const req = http.expectOne('http://api/procesos/7/compartidos/2');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('recibidos hace GET en procesos-compartidos', () => {
    servicio.recibidos().subscribe();

    const req = http.expectOne('http://api/procesos-compartidos');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('detalle hace GET en procesos-compartidos con el id del proceso', () => {
    servicio.detalle(7).subscribe();

    const req = http.expectOne('http://api/procesos-compartidos/7');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
