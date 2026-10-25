// Roles de proceso (los que se asignan a las lanes).
export interface RolProcesoRequest {
  nombre: string;
  descripcion?: string;
}

export interface RolProcesoVistaResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  procesosQueLoUsan: number;
  enUso: boolean;
}

export interface RolProcesoConsultaResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  procesos: string[];
  enUso: boolean;
}
