import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  isGoogleCompletion = false;
  readonly countryOptions = [
    { value: 'CO', label: 'Colombia' },
    { value: 'US', label: 'Estados Unidos' },
    { value: 'MX', label: 'Mexico' },
    { value: 'ES', label: 'Espana' },
    { value: 'AR', label: 'Argentina' },
    { value: 'CL', label: 'Chile' },
    { value: 'PE', label: 'Peru' },
  ];

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ'\- ]+$/)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ'\- ]+$/)]],
    documentType: ['CC', [Validators.required]],
    documentNumber: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20), Validators.pattern(/^\d+$/)]],
    country: ['CO', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    this.isGoogleCompletion = mode === 'google-complete';

    if (this.isGoogleCompletion) {
      const firstName = this.route.snapshot.queryParamMap.get('firstName') || '';
      const lastName = this.route.snapshot.queryParamMap.get('lastName') || '';
      const email = this.route.snapshot.queryParamMap.get('email') || '';

      this.form.patchValue({ firstName, lastName, email });
      this.form.controls.email.disable({ emitEvent: false });
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
      this.form.controls.documentType.setValue('CC', { emitEvent: false });
    }
  }

  async cancelRegistration(): Promise<void> {
    if (this.isGoogleCompletion) {
      await this.authService.logout();
      return;
    }

    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async register(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    await this.loadingService.show('Creando cuenta...');
    try {
      const raw = this.form.getRawValue();
      if (this.isGoogleCompletion) {
        await this.authService.completeGoogleProfile({
          firstName: raw.firstName || '',
          lastName: raw.lastName || '',
          documentType: raw.documentType || 'CC',
          documentNumber: raw.documentNumber || '',
          country: raw.country || 'CO',
          email: raw.email || '',
        });
        await this.toastService.show('Perfil completado correctamente');
      } else {
        await this.authService.registerWithEmail({
          firstName: raw.firstName || '',
          lastName: raw.lastName || '',
          documentType: raw.documentType || 'CC',
          documentNumber: raw.documentNumber || '',
          country: raw.country || 'CO',
          email: raw.email || '',
          password: raw.password || '',
        });
        await this.toastService.show('Cuenta creada correctamente');
      }
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      await this.toastService.show(this.authService.getAuthErrorMessage(error));
    } finally {
      await this.loadingService.hide();
    }
  }
}
