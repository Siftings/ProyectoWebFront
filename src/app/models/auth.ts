// Autenticación, empresas, usuarios e invitaciones.
import { RolAcceso } from './enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroEmpresaRequest {
  nombreEmpresa: string;
  nit: string;
  correoContacto: string;
  nombreAdmin: string;
  emailAdmin: string;
  passwordAdmin: string;
}

export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rolAcceso: RolAcceso;
}

export interface ActualizarUsuarioRequest {
  rolAcceso?: RolAcceso;
  activo?: boolean;
}

export interface InvitacionUsuarioRequest {
  email: string;
  rolAcceso: RolAcceso;
}

export interface AceptarInvitacionRequest {
  nombre: string;
  password: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rolAcceso: RolAcceso;
  activo: boolean;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  usuario: UsuarioResponse;
}

export interface EmpresaResponse {
  id: number;
  nombre: string;
  nit: string;
  correoContacto: string;
  fechaRegistro: string;
}

export interface EmpresaResumenResponse {
  id: number;
  nombre: string;
}

export interface InvitacionUsuarioResponse {
  id: number;
  email: string;
  rolAcceso: RolAcceso;
  token: string;
  fechaExpiracion: string;
}
