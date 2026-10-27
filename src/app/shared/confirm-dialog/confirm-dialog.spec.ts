import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

const showModal = vi.fn();
const close = vi.fn();

beforeEach(() => {
  showModal.mockReset();
  close.mockReset();
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
    showModal();
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
    close();
    this.open = false;
  };
});

function crear(entradas: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(ConfirmDialog);
  fixture.componentRef.setInput('abierto', false);
  fixture.componentRef.setInput('titulo', 'Eliminar actividad');
  for (const [nombre, valor] of Object.entries(entradas)) {
    fixture.componentRef.setInput(nombre, valor);
  }
  fixture.detectChanges();
  return fixture;
}

function raiz(fixture: ComponentFixture<ConfirmDialog>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('ConfirmDialog', () => {
  it('abre y cierra el dialog según abierto', () => {
    const fixture = crear();
    expect(showModal).not.toHaveBeenCalled();

    fixture.componentRef.setInput('abierto', true);
    fixture.detectChanges();
    expect(showModal).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('abierto', false);
    fixture.detectChanges();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('muestra título, mensaje y advertencias', () => {
    const fixture = crear({
      mensaje: '¿Eliminar?',
      advertencias: ['Rompe el flujo.', 'Borra 2 arcos.'],
    });
    const el = raiz(fixture);
    expect(el.querySelector('h2')?.textContent).toBe('Eliminar actividad');
    expect(el.querySelector('p')?.textContent).toBe('¿Eliminar?');
    const items = Array.from(el.querySelectorAll('li')).map((li) => li.textContent);
    expect(items).toEqual(['Rompe el flujo.', 'Borra 2 arcos.']);
  });

  it('sin advertencias ni mensaje no pinta lista ni párrafo', () => {
    const el = raiz(crear());
    expect(el.querySelector('ul')).toBeNull();
    expect(el.querySelector('p')).toBeNull();
  });

  it('emite confirmar y cancelar con los botones', () => {
    const fixture = crear({ textoConfirmar: 'Eliminar' });
    const confirmar = vi.fn();
    const cancelar = vi.fn();
    fixture.componentInstance.confirmar.subscribe(confirmar);
    fixture.componentInstance.cancelar.subscribe(cancelar);
    const [btnCancelar, btnConfirmar] = Array.from(raiz(fixture).querySelectorAll('button'));

    expect(btnConfirmar.textContent?.trim()).toBe('Eliminar');
    btnCancelar.click();
    btnConfirmar.click();

    expect(cancelar).toHaveBeenCalledTimes(1);
    expect(confirmar).toHaveBeenCalledTimes(1);
  });

  it('Esc emite cancelar y no cierra el dialog por su cuenta', () => {
    const fixture = crear();
    const cancelar = vi.fn();
    fixture.componentInstance.cancelar.subscribe(cancelar);
    const evento = new Event('cancel', { cancelable: true });

    raiz(fixture).querySelector('dialog')?.dispatchEvent(evento);

    expect(evento.defaultPrevented).toBe(true);
    expect(cancelar).toHaveBeenCalledTimes(1);
  });

  it('un cierre nativo con abierto aún en true emite cancelar', () => {
    const fixture = crear();
    const cancelar = vi.fn();
    fixture.componentInstance.cancelar.subscribe(cancelar);
    const dialogo = raiz(fixture).querySelector('dialog');

    dialogo?.dispatchEvent(new Event('close'));
    expect(cancelar).not.toHaveBeenCalled();

    fixture.componentRef.setInput('abierto', true);
    fixture.detectChanges();
    dialogo?.dispatchEvent(new Event('close'));
    expect(cancelar).toHaveBeenCalledTimes(1);
  });

  it('peligro usa el botón de peligro y si no el primario', () => {
    const normal = Array.from(raiz(crear()).querySelectorAll('button'))[1];
    expect(normal.classList.contains('btn-primario')).toBe(true);

    const peligro = Array.from(raiz(crear({ peligro: true })).querySelectorAll('button'))[1];
    expect(peligro.classList.contains('btn-peligro')).toBe(true);
  });
});
