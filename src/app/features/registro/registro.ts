// Registro de empresa con su administrador (POST /empresas) e inicio de sesión automático después.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, catchError, switchMap, tap } from 'rxjs';
import { erroresFormulario } from '../../core/errors/problem-detail';
import { AlertaError } from '../../shared/alerta-error/alerta-error';
import { ErrorCampo } from '../../shared/error-campo/error-campo';
import { AuthService } from '../../core/services/auth.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { RegistroEmpresaRequest } from '../../models/auth';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AlertaError, ErrorCampo],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private readonly empresas = inject(EmpresasService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = inject(FormBuilder).nonNullable.group({
    nombreEmpresa: ['', [Validators.required, Validators.pattern(/\S/)]],
    nit: ['', [Validators.required, Validators.pattern(/\S/)]],
    correoContacto: ['', [Validators.required, Validators.email]],
    nombreAdmin: ['', [Validators.required, Validators.pattern(/\S/)]],
    emailAdmin: ['', [Validators.required, Validators.email]],
    passwordAdmin: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    const req: RegistroEmpresaRequest = {
      nombreEmpresa: valor.nombreEmpresa.trim(),
      nit: valor.nit.trim(),
      correoContacto: valor.correoContacto.trim(),
      nombreAdmin: valor.nombreAdmin.trim(),
      emailAdmin: valor.emailAdmin.trim(),
      passwordAdmin: valor.passwordAdmin,
    };
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    this.empresas
      .registrar(req)
      .pipe(switchMap(() => this.iniciarSesion(req.emailAdmin, req.passwordAdmin)))
      .subscribe({
        error: (err: unknown) => {
          const { mensaje, campos } = erroresFormulario(err);
          this.error.set(mensaje);
          this.erroresCampo.set(campos);
          this.enviando.set(false);
        },
      });
  }

  private iniciarSesion(email: string, password: string): Observable<unknown> {
    return this.auth.login({ email, password }).pipe(
      tap(() => void this.router.navigate(['/'])),
      catchError(() => {
        void this.router.navigate(['/login'], { queryParams: { email } });
        return EMPTY;
      }),
    );
  }
}
