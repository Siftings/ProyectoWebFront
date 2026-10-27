import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { PermisoEstructuraResponse } from '../../models/permisos';
import { PermisosEstructuraService } from './permisos-estructura.service';

const EDITOR: PermisoEstructuraResponse = {
  rolAcceso: 'EDITOR',
  crearPool: true,
  editarPool: true,
  eliminarPool: false,
  crearLane: true,
  editarLane: true,
  eliminarLane: false,
};

describe('PermisosEstructuraService', () => {
  let servicio: PermisosEstructuraService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      ],
    });
    servicio = TestBed.inject(PermisosEstructuraService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar hace GET y devuelve el arreglo', () => {
    let recibidos: PermisoEstructuraResponse[] | undefined;
    servicio.listar().subscribe((p) => (recibidos = p));

    const req = http.expectOne('http://api/permisos-estructura');
    expect(req.request.method).toBe('GET');
    req.flush([EDITOR]);
    expect(recibidos).toEqual([EDITOR]);
  });

  it('actualizar hace PUT por rol con los 6 campos y sin rolAcceso', () => {
    servicio.actualizar('EDITOR', { ...EDITOR, crearPool: false }).subscribe();

    const req = http.expectOne('http://api/permisos-estructura/EDITOR');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      crearPool: false,
      editarPool: true,
      eliminarPool: false,
      crearLane: true,
      editarLane: true,
      eliminarLane: false,
    });
    req.flush(EDITOR);
  });
});
