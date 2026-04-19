import { Component, EventEmitter, Input, Output } from '@angular/core';
import { WalletTransaction } from 'src/app/core/models/app.models';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
  standalone: false,
})
export class TransactionListComponent {
  @Input() transactions: WalletTransaction[] = [];
  @Output() itemLongPress = new EventEmitter<WalletTransaction>();

  get groupedTransactions(): Array<{ label: string; items: WalletTransaction[] }> {
    const grouped = new Map<string, WalletTransaction[]>();

    for (const tx of this.transactions) {
      const key = tx.date.slice(0, 10);
      const bucket = grouped.get(key) || [];
      bucket.push(tx);
      grouped.set(key, bucket);
    }

    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, items]) => ({
        label: new Date(`${dateKey}T00:00:00`).toLocaleDateString('es-CO', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        items,
      }));
  }
}
