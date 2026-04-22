import { Location } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Subscription } from 'rxjs';
import { CardService } from 'src/app/core/services/card.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { ToastService } from 'src/app/core/services/toast.service';

const expiryValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value || '').trim();
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return { expiryFormat: true };
  }

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) {
    return { expiryFormat: true };
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { expiryPast: true };
  }

  return null;
};

@Component({
  selector: 'app-add-card',
  templateUrl: './add-card.page.html',
  styleUrls: ['./add-card.page.scss'],
  standalone: false,
})
export class AddCardPage implements AfterViewInit, OnDestroy {
  @ViewChild('previewCard', { read: ElementRef }) previewCard?: ElementRef<HTMLElement>;

  readonly form = this.fb.group({
    holderName: ['', [Validators.required]],
    cardNumber: ['', [Validators.required]],
    expiry: ['', [Validators.required, expiryValidator]],
    cvc: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]],
  });

  brand = 'unknown';
  previewHolderName = 'TU NOMBRE';
  previewNumber = 'XXXX XXXX XXXX XXXX';
  previewExpiry = 'MM/YY';
  previewCvc = '***';
  private formSub?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly cardService: CardService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly location: Location,
  ) {
    this.formSub = this.form.valueChanges.subscribe((value) => {
      this.previewHolderName = (value.holderName || 'TU NOMBRE').toUpperCase();
      this.previewNumber = value.cardNumber || 'XXXX XXXX XXXX XXXX';
      this.previewExpiry = value.expiry || 'MM/YY';
      this.previewCvc = value.cvc || '***';
      this.animatePreviewPulse();
    });
  }

  ngAfterViewInit(): void {
    this.animatePreviewEnter();
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  goBack(): void {
    this.location.back();
  }

  onCardInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.cardService.formatCardNumber(input.value);
    this.form.controls.cardNumber.setValue(formatted, { emitEvent: false });
    this.brand = this.cardService.detectBrand(formatted);
    this.previewNumber = formatted || 'XXXX XXXX XXXX XXXX';
    this.animatePreviewPulse();
  }

  onExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.cardService.formatExpiry(input.value);
    this.form.controls.expiry.setValue(formatted, { emitEvent: false });
    this.previewExpiry = formatted || 'MM/YY';
    this.animatePreviewPulse();
  }

  onCvcInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = input.value.replace(/\D/g, '').slice(0, 4);
    this.form.controls.cvc.setValue(formatted, { emitEvent: false });
    this.previewCvc = formatted || '***';
    this.animatePreviewPulse();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (!this.cardService.isValidLuhn(raw.cardNumber || '')) {
      await this.toastService.show('Numero de tarjeta invalido (Luhn)');
      return;
    }

    await this.loadingService.show('Guardando tarjeta...');
    try {
      await this.cardService.createCard({
        holderName: raw.holderName || '',
        cardNumber: raw.cardNumber || '',
        expiry: raw.expiry || '',
      });
      await Haptics.impact({ style: ImpactStyle.Light });
      await this.toastService.show('Tarjeta agregada correctamente');
      await this.router.navigateByUrl('/home');
    } catch {
      await this.toastService.show('No se pudo guardar la tarjeta');
    } finally {
      await this.loadingService.hide();
    }
  }

  private animatePreviewEnter(): void {
    const element = this.previewCard?.nativeElement;
    if (!element) {
      return;
    }

    void import('animejs').then(({ animate }) => {
      animate(element, {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.97, 1],
        duration: 560,
        easing: 'out(4)',
      });
    });
  }

  private animatePreviewPulse(): void {
    const element = this.previewCard?.nativeElement;
    if (!element) {
      return;
    }

    void import('animejs').then(({ animate }) => {
      animate(element, {
        scale: [1, 1.018, 1],
        duration: 260,
        easing: 'inOut(2)',
      });
    });
  }
}
