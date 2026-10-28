import { moverLane } from './orden-lanes';

describe('moverLane', () => {
  it('sube una lane intercambiándola con la anterior', () => {
    expect(moverLane([1, 2, 3], 2, -1)).toEqual([2, 1, 3]);
  });

  it('baja una lane intercambiándola con la siguiente', () => {
    expect(moverLane([1, 2, 3], 2, 1)).toEqual([1, 3, 2]);
  });

  it('no sube la primera ni baja la última', () => {
    expect(moverLane([1, 2, 3], 1, -1)).toBeNull();
    expect(moverLane([1, 2, 3], 3, 1)).toBeNull();
  });

  it('devuelve null si el id no está', () => {
    expect(moverLane([1, 2, 3], 9, 1)).toBeNull();
  });

  it('no modifica la lista original', () => {
    const ids = [1, 2, 3];
    moverLane(ids, 1, 1);
    expect(ids).toEqual([1, 2, 3]);
  });
});
