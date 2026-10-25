// Arcos (flechas de secuencia) entre nodos de un mismo pool.
export interface ArcoRequest {
  origenId: number;
  destinoId: number;
  etiqueta?: string;
  condicion?: string;
}

export interface EditarArcoRequest {
  etiqueta?: string | null;
  condicion?: string | null;
  origenId?: number | null;
  destinoId?: number | null;
}

export interface ArcoResponse {
  id: number;
  etiqueta: string | null;
  condicion: string | null;
  origenId: number;
  destinoId: number;
  poolId: number;
}
