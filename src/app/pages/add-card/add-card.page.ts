import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardService } from 'src/app/core/services/card.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-add-card',
  templateUrl: './add-card.page.html',
  styleUrls: ['./add-card.page.scss'],
  standalone: false,
})
export class AddCardPage {
  readonly form = this.fb.group({
    holderName: ['', [Validators.required]],
    cardNumber: ['', [Validators.required]],
    expiry: ['', [Validators.required]],
  });

  brand = 'unknown';

  constructor(
    private readonly fb: FormBuilder,
    private readonly cardService: CardService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly location: Location,
  ) {}

  goBack(): void {
    this.location.back();
  }

  onCardInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.cardService.formatCardNumber(input.value);
    this.form.controls.cardNumber.setValue(formatted, { emitEvent: false });
    this.brand = this.cardService.detectBrand(formatted);
  }

  onExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.cardService.formatExpiry(input.value);
    this.form.controls.expiry.setValue(formatted, { emitEvent: false });
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
      await this.toastService.show('Tarjeta agregada correctamente');
      await this.router.navigateByUrl('/home');
    } catch {
      await this.toastService.show('No se pudo guardar la tarjeta');
    } finally {
      await this.loadingService.hide();
    }
  }
}
