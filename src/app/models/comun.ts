// Tipos comunes del API: paginación e impacto de eliminación.
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ImpactoEliminacionResponse {
  requiereConfirmacion: boolean;
  rompeContinuidad: boolean;
  advertencias: string[];
}
