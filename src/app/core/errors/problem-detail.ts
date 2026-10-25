// Lee errores ProblemDetail del backend y extrae el detail y los errores por campo.
import { HttpErrorResponse } from '@angular/common/http';

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}

const SIN_CONEXION = 'No se pudo conectar con el servidor.';
const ERROR_GENERICO = 'Ocurrió un error inesperado. Intenta nuevamente más tarde.';

function esProblema(valor: unknown): valor is ProblemDetail {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const candidato = valor as Partial<Record<keyof ProblemDetail, unknown>>;
  return (
    typeof candidato.status === 'number' &&
    typeof candidato.title === 'string' &&
    typeof candidato.detail === 'string'
  );
}

export function leerProblema(err: unknown): ProblemDetail | null {
  if (!(err instanceof HttpErrorResponse)) {
    return null;
  }
  let cuerpo: unknown = err.error;
  if (typeof cuerpo === 'string') {
    try {
      cuerpo = JSON.parse(cuerpo);
    } catch {
      return null;
    }
  }
  return esProblema(cuerpo) ? cuerpo : null;
}

export function detalleError(err: unknown): string {
  const problema = leerProblema(err);
  if (problema) {
    return problema.detail;
  }
  return err instanceof HttpErrorResponse && err.status === 0 ? SIN_CONEXION : ERROR_GENERICO;
}

export function erroresPorCampo(problema: ProblemDetail): Record<string, string> {
  if (problema.status !== 400 || problema.title !== 'Validación fallida') {
    return {};
  }
  const errores: Record<string, string> = {};
  for (const trozo of problema.detail.split('; ')) {
    const i = trozo.indexOf(': ');
    if (i <= 0) {
      continue;
    }
    const campo = trozo.slice(0, i);
    const mensaje = trozo.slice(i + 2);
    errores[campo] = Object.hasOwn(errores, campo) ?`${errores[campo]} ${mensaje}` : mensaje;
  }
  return errores;
}
