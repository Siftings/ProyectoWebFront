// Registro de empresa con su administrador contra POST /empresas.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { erroresFormulario } from '../../core/errors/problem-detail';
import { EmpresasService } from '../../core/services/empresas.service';
import { RegistroEmpresaRequest } from '../../models/auth';

interface EmpresaCreada {
  nombre: string;
  nit: string;
  emailAdmin: string;
}

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private readonly empresas = inject(EmpresasService);

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
  readonly creada = signal<EmpresaCreada | null>(null);

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
    this.creada.set(null);
    this.empresas
      .registrar(req)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (empresa) => {
          this.creada.set({ nombre: empresa.nombre, nit: empresa.nit, emailAdmin: req.emailAdmin });
          this.form.reset();
        },
        error: (err: unknown) => {
          const { mensaje, campos } = erroresFormulario(err);
          this.error.set(mensaje);
          this.erroresCampo.set(campos);
        },
      });
  }
}
