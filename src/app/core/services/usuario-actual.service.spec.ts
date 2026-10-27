import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { RolAcceso } from '../../models/enums';
import { UsuarioActualService } from './usuario-actual.service';

function crearServicio(rolAcceso: RolAcceso): UsuarioActualService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: ConfigService, useValue: { usuarioFijo: { email: 'a@demo.com', rolAcceso } } }],
  });
  return TestBed.inject(UsuarioActualService);
}

describe('UsuarioActualService', () => {
  it('expone el usuario fijo de la configuración', () => {
    const servicio = crearServicio('EDITOR');
    expect(servicio.usuario()).toEqual({ email: 'a@demo.com', rolAcceso: 'EDITOR' });
    expect(servicio.rol()).toBe('EDITOR');
  });

  it('el administrador es admin y puede editar', () => {
    const servicio = crearServicio('ADMINISTRADOR');
    expect(servicio.esAdmin()).toBe(true);
    expect(servicio.puedeEditar()).toBe(true);
  });

  it('el editor puede editar pero no es admin', () => {
    const servicio = crearServicio('EDITOR');
    expect(servicio.esAdmin()).toBe(false);
    expect(servicio.puedeEditar()).toBe(true);
  });

  it('esUsuarioActual compara el correo sin distinguir mayúsculas ni espacios', () => {
    const servicio = crearServicio('ADMINISTRADOR');
    expect(servicio.esUsuarioActual('a@demo.com')).toBe(true);
    expect(servicio.esUsuarioActual(' A@Demo.com ')).toBe(true);
    expect(servicio.esUsuarioActual('b@demo.com')).toBe(false);
  });

  it('solo lectura no es admin ni puede editar', () => {
    const servicio = crearServicio('SOLO_LECTURA');
    expect(servicio.esAdmin()).toBe(false);
    expect(servicio.puedeEditar()).toBe(false);
  });
});
