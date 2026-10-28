import { posicionArrastrada } from './arrastre';

describe('posicionArrastrada', () => {
  it('suma el desplazamiento al origen', () => {
    expect(posicionArrastrada({ x: 40, y: 40 }, { x: 25, y: 10 })).toEqual({ x: 65, y: 50 });
  });

  it('no baja de 0', () => {
    expect(posicionArrastrada({ x: 40, y: 40 }, { x: -100, y: -41 })).toEqual({ x: 0, y: 0 });
  });

  it('redondea a entero', () => {
    expect(posicionArrastrada({ x: 10, y: 10 }, { x: 5.4, y: 5.6 })).toEqual({ x: 15, y: 16 });
  });
});
