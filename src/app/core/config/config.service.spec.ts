import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';

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

  it('lee apiUrl desde config.json', async () => {
    const loading = service.load();
    http.expectOne('config.json').flush({ apiUrl: 'http://localhost:8080/api/v1' });
    await loading;
    expect(service.apiUrl).toBe('http://localhost:8080/api/v1');
  });

  it('quita la barra final de apiUrl', async () => {
    const loading = service.load();
    http.expectOne('config.json').flush({ apiUrl: 'http://localhost:8080/api/v1/' });
    await loading;
    expect(service.apiUrl).toBe('http://localhost:8080/api/v1');
  });

  it('falla si config.json no trae apiUrl', async () => {
    const loading = service.load();
    http.expectOne('config.json').flush({});
    await expect(loading).rejects.toThrow('apiUrl');
  });

  it('falla si apiUrl está vacío', async () => {
    const loading = service.load();
    http.expectOne('config.json').flush({ apiUrl: '  ' });
    await expect(loading).rejects.toThrow('apiUrl');
  });

  it('lanza error si se lee apiUrl antes de cargar', () => {
    expect(() => service.apiUrl).toThrow();
  });
});
