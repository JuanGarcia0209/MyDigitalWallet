import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { faker } from '@faker-js/faker';
import { map, Observable } from 'rxjs';
import { WalletTransaction } from '../models/app.models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(
    private readonly authService: AuthService,
    private readonly firestoreService: FirestoreService,
  ) {}

  buildSimulation(): { merchant: string; amount: number } {
    return {
      merchant: faker.company.name(),
      amount: faker.number.int({ min: 5000, max: 250000 }),
    };
  }

  async processPayment(cardId: string, merchant: string, amount: number): Promise<string> {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      throw new Error('No hay sesion activa');
    }

    const id = await this.firestoreService.add<WalletTransaction>('transactions', {
      uid,
      cardId,
      merchant,
      amount,
      date: new Date().toISOString(),
    });

    await Haptics.impact({ style: ImpactStyle.Medium });
    return id;
  }

  getTransactions(cardId?: string, day?: string): Observable<WalletTransaction[]> {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      return new Observable<WalletTransaction[]>((subscriber) => {
        subscriber.next([]);
        subscriber.complete();
      });
    }

    return this.firestoreService.getCollectionWhere<WalletTransaction>('transactions', 'uid', uid).pipe(
      map((txs) =>
        txs
          .filter((tx) => (cardId ? tx.cardId === cardId : true))
          .filter((tx) => (day ? this.toLocalDateKey(tx.date) === day : true))
          .sort((a, b) => b.date.localeCompare(a.date)),
      ),
    );
  }

  private toLocalDateKey(value: string): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateReaction(transactionId: string, emoji: string): Promise<void> {
    return this.firestoreService.update<WalletTransaction>('transactions', transactionId, { emoji });
  }
}
