import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CardBrand, WalletCard } from '../models/app.models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

@Injectable({ providedIn: 'root' })
export class CardService {
  constructor(
    private readonly authService: AuthService,
    private readonly firestoreService: FirestoreService,
  ) {}

  formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) {
      return digits;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  detectBrand(cardNumber: string): CardBrand {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.startsWith('4')) {
      return 'visa';
    }

    const firstTwo = Number(digits.slice(0, 2));
    const firstFour = Number(digits.slice(0, 4));
    if ((firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720)) {
      return 'mastercard';
    }

    return 'unknown';
  }

  isValidLuhn(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number(digits.charAt(i));
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return digits.length >= 13 && sum % 10 === 0;
  }

  async createCard(data: { holderName: string; cardNumber: string; expiry: string }): Promise<void> {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      throw new Error('No hay sesion activa');
    }

    const cleanNumber = data.cardNumber.replace(/\D/g, '');
    const masked = `**** **** **** ${cleanNumber.slice(-4)}`;

    await this.firestoreService.add<WalletCard>('cards', {
      uid,
      holderName: data.holderName,
      cardNumber: cleanNumber,
      maskedNumber: masked,
      expiry: data.expiry,
      brand: this.detectBrand(cleanNumber),
      createdAt: new Date().toISOString(),
    });
  }

  async updateCard(cardId: string, data: { holderName: string; expiry: string }): Promise<void> {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      throw new Error('No hay sesion activa');
    }

    await this.firestoreService.update<WalletCard>('cards', cardId, {
      holderName: data.holderName,
      expiry: data.expiry,
    });
  }

  async deleteCard(cardId: string): Promise<void> {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      throw new Error('No hay sesion activa');
    }

    await this.firestoreService.delete('cards', cardId);
  }

  getMyCards(): Observable<WalletCard[]> {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      return new Observable<WalletCard[]>((subscriber) => {
        subscriber.next([]);
        subscriber.complete();
      });
    }

    return this.firestoreService.getCollectionWhere<WalletCard>('cards', 'uid', uid).pipe(
      map((cards) => cards.sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    );
  }
}
