import { TestBed } from '@angular/core/testing';
import { EstadoProceso } from '../../models/enums';
import { EstadoBadge } from './estado-badge';

function crear(estado: EstadoProceso) {
  const fixture = TestBed.createComponent(EstadoBadge);
  fixture.componentRef.setInput('estado', estado);
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).querySelector('.badge');
}

describe('EstadoBadge', () => {
  it('muestra Borrador sin la clase publicado', () => {
    const badge = crear('BORRADOR');
    expect(badge?.textContent).toBe('Borrador');
    expect(badge?.classList.contains('publicado')).toBe(false);
  });

  it('muestra Publicado con la clase publicado', () => {
    const badge = crear('PUBLICADO');
    expect(badge?.textContent).toBe('Publicado');
    expect(badge?.classList.contains('publicado')).toBe(true);
  });
});
