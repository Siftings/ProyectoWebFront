import { HttpErrorResponse } from '@angular/common/http';
import { detalleError, erroresPorCampo, leerProblema, ProblemDetail } from './problem-detail';

function problema(status: number, title: string, detail: string): ProblemDetail {
  return { type: 'about:blank', title, status, detail, instance: '/api/v1/procesos' };
}

describe('problem-detail', () => {
  describe('leerProblema', () => {
    it('lee un ProblemDetail que llega como objeto', () => {
      const p = problema(409, 'Regla de negocio violada', 'Ya existe un proceso.');
      expect(leerProblema(new HttpErrorResponse({ status: 409, error: p }))).toEqual(p);
    });

    it('lee un ProblemDetail que llega como string JSON', () => {
      const p = problema(409, 'Regla de negocio violada', 'Ya existe un proceso.');
      const err = new HttpErrorResponse({ status: 409, error: JSON.stringify(p) });
      expect(leerProblema(err)).toEqual(p);
    });

    it('devuelve null si el cuerpo no es un ProblemDetail', () => {
      expect(leerProblema(new HttpErrorResponse({ status: 500, error: { foo: 1 } }))).toBeNull();
      expect(leerProblema(new HttpErrorResponse({ status: 500, error: 'texto' }))).toBeNull();
      expect(leerProblema(new HttpErrorResponse({ status: 500, error: null }))).toBeNull();
    });

    it('devuelve null si el error no es un HttpErrorResponse', () => {
      expect(leerProblema(new Error('falló'))).toBeNull();
      expect(leerProblema(undefined)).toBeNull();
    });
  });

  describe('detalleError', () => {
    it('devuelve el detail tal cual', () => {
      const p = problema(409, 'Regla de negocio violada', 'Ya existe un proceso activo con el nombre "Compras".');
      expect(detalleError(new HttpErrorResponse({ status: 409, error: p }))).toBe(p.detail);
    });

    it('avisa que no hay conexión cuando el status es 0', () => {
      expect(detalleError(new HttpErrorResponse({ status: 0 }))).toBe('No se pudo conectar con el servidor.');
    });

    it('usa el mensaje genérico en un 500 sin cuerpo y en errores desconocidos', () => {
      const generico = 'Ocurrió un error inesperado. Intenta nuevamente más tarde.';
      expect(detalleError(new HttpErrorResponse({ status: 500 }))).toBe(generico);
      expect(detalleError('algo raro')).toBe(generico);
    });
  });

  describe('erroresPorCampo', () => {
    it('separa un campo', () => {
      const p = problema(400, 'Validación fallida', 'nombre: El nombre es obligatorio.');
      expect(erroresPorCampo(p)).toEqual({ nombre: 'El nombre es obligatorio.' });
    });

    it('separa varios campos', () => {
      const p = problema(
        400,
        'Validación fallida',
        'nombre: El nombre es obligatorio.; categoria: La categoria es obligatoria.',
      );
      expect(erroresPorCampo(p)).toEqual({
        nombre: 'El nombre es obligatorio.',
        categoria: 'La categoria es obligatoria.',
      });
    });

    it('une los mensajes de un campo repetido', () => {
      const p = problema(400, 'Validación fallida', 'password: Es obligatoria.; password: Mínimo 8 caracteres.');
      expect(erroresPorCampo(p)).toEqual({ password: 'Es obligatoria. Mínimo 8 caracteres.' });
    });

    it('trata como campo normal un nombre que existe en el prototipo', () => {
      const p = problema(400, 'Validación fallida', 'constructor: Valor inválido.');
      expect(erroresPorCampo(p)['constructor']).toBe('Valor inválido.');
    });

    it('devuelve vacío si no es una validación fallida', () => {
      expect(erroresPorCampo(problema(400, 'JSON inválido', 'nombre: x'))).toEqual({});
      expect(erroresPorCampo(problema(409, 'Regla de negocio violada', 'nombre: x'))).toEqual({});
    });

    it('ignora los trozos mal formados', () => {
      const p = problema(400, 'Validación fallida', 'sin separador; : sin campo; email: Email inválido.');
      expect(erroresPorCampo(p)).toEqual({ email: 'Email inválido.' });
    });
  });
});
