import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly biometricService: BiometricService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  async login(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    if (!email || !password) {
      return;
    }

    await this.loadingService.show('Iniciando sesion...');
    try {
      await this.authService.loginWithEmail(email, password);
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      await this.toastService.show(this.authService.getAuthErrorMessage(error));
    } finally {
      await this.loadingService.hide();
    }
  }

  async loginWithBiometric(): Promise<void> {
    const available = await this.biometricService.isAvailable();
    if (!available) {
      await this.toastService.show('Biometria no disponible en este dispositivo');
      return;
    }

    const verified = await this.biometricService.verifyIdentity('Acceso rapido a MyDigitalWallet');
    if (!verified) {
      await this.toastService.show('No se pudo validar la biometria');
      return;
    }

    const credentials = await this.biometricService.getCredentials();
    if (!credentials) {
      await this.toastService.show('No hay credenciales guardadas para acceso rapido');
      return;
    }

    this.form.patchValue({ email: credentials.username, password: credentials.password });
    await this.login();
  }

  async loginGoogle(): Promise<void> {
    try {
      const result = await this.authService.loginWithGoogle();
      if (result.needsProfileCompletion) {
        await this.toastService.show('Completa tu registro para continuar');
        await this.router.navigate(['/register'], {
          queryParams: {
            mode: 'google-complete',
            firstName: result.profile.firstName,
            lastName: result.profile.lastName,
            email: result.profile.email,
          },
        });
        return;
      }

      await this.toastService.show('Sesion con Google iniciada');
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      await this.toastService.show(this.authService.getAuthErrorMessage(error));
    }
  }
}
