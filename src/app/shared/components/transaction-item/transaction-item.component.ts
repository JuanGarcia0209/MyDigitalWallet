import { Component, EventEmitter, Input, Output } from '@angular/core';
import { WalletTransaction } from 'src/app/core/models/app.models';

@Component({
  selector: 'app-transaction-item',
  templateUrl: './transaction-item.component.html',
  styleUrls: ['./transaction-item.component.scss'],
  standalone: false,
})
export class TransactionItemComponent {
  @Input({ required: true }) transaction!: WalletTransaction;
  @Output() longPress = new EventEmitter<WalletTransaction>();

  private timer?: ReturnType<typeof setTimeout>;

  onPressStart(): void {
    this.timer = setTimeout(() => this.longPress.emit(this.transaction), 2000);
  }

  onPressEnd(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
