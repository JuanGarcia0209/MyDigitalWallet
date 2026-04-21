import { Component, EventEmitter, Input, Output } from '@angular/core';
import { WalletCard } from 'src/app/core/models/app.models';

@Component({
  selector: 'app-payment-simulator',
  templateUrl: './payment-simulator.component.html',
  styleUrls: ['./payment-simulator.component.scss'],
  standalone: false,
})
export class PaymentSimulatorComponent {
  @Input() card?: WalletCard;
  @Input() merchant = '';
  @Input() amount = 0;
  @Output() regenerate = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
