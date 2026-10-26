import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';

const USUARIO_FIJO = { email: 'admin@demo.com', rolAcceso: 'ADMINISTRADOR' };

describe('ConfigService', () => {
  let service: ConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lee apiUrl y usuarioFijo desde config.json', async () => {
    const loading = service.load();
    http
      .expectOne('config.json')
      .flush({ apiUrl: 'http://localhost:8080/api/v1', usuarioFijo: USUARIO_FIJO });
    await loading;
    expect(service.apiUrl).toBe('http://localhost:8080/api/v1');
    expect(service.usuarioFijo).toEqual(USUARIO_FIJO);
  });

  it('quita la barra final de apiUrl y los espacios del email', async () => {
    const loading = service.load();
    http.expectOne('config.json').flush({
      apiUrl: 'http://localhost:8080/api/v1/',
      usuarioFijo: { email: ' admin@demo.com ', rolAcceso: 'EDITOR' },
    });
    await loading;
    expect(service.apiUrl).toBe('http://localhost:8080/api/v1');
    expect(service.usuarioFijo).toEqual({ email: 'admin@demo.com', rolAcceso: 'EDITOR' });
  });

  it('falla si config.json no trae apiUrl', async () => {
    const loading = service.load();
    http.expectOne('config.json').flush({ usuarioFijo: USUARIO_FIJO });
    await expect(loading).rejects.toThrow('apiUrl');
  });

  it('falla si apiUrl está vacío', async () => {
    const loading = service.load();
    http.expectOne('config.json').flush({ apiUrl: '  ', usuarioFijo: USUARIO_FIJO });
    await expect(loading).rejects.toThrow('apiUrl');
  });

  it('falla si config.json no trae usuarioFijo', async () => {
    const loading = service.load();
    http.expectOne('config.json').flush({ apiUrl: 'http://api' });
    await expect(loading).rejects.toThrow('usuarioFijo');
  });

  it('falla si el email del usuario fijo está vacío', async () => {
    const loading = service.load();
    http
      .expectOne('config.json')
      .flush({ apiUrl: 'http://api', usuarioFijo: { email: ' ', rolAcceso: 'EDITOR' } });
    await expect(loading).rejects.toThrow('usuarioFijo');
  });

  it('falla si el rol del usuario fijo no existe', async () => {
    const loading = service.load();
    http
      .expectOne('config.json')
      .flush({ apiUrl: 'http://api', usuarioFijo: { email: 'a@b.com', rolAcceso: 'ROOT' } });
    await expect(loading).rejects.toThrow('usuarioFijo');
  });

  it('lanza error si se lee antes de cargar', () => {
    expect(() => service.apiUrl).toThrow();
    expect(() => service.usuarioFijo).toThrow();
  });
});
