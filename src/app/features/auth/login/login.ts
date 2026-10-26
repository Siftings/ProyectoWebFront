// Pantalla de login: formulario reactivo contra POST /auth/login.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { detalleError, erroresPorCampo, leerProblema } from '../../../core/errors/problem-detail';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresCampo = signal<Record<string, string>>({});

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.erroresCampo.set({});
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl(this.destino()),
        error: (err: unknown) => {
          this.error.set(detalleError(err));
          const problema = leerProblema(err);
          this.erroresCampo.set(problema ? erroresPorCampo(problema) : {});
        },
      });
  }

  private destino(): string {
    const destino = this.route.snapshot.queryParamMap.get('returnUrl');
    return destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/';
  }
}
