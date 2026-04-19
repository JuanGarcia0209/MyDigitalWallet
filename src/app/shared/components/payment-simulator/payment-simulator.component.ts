import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-payment-simulator',
  templateUrl: './payment-simulator.component.html',
  styleUrls: ['./payment-simulator.component.scss'],
  standalone: false,
})
export class PaymentSimulatorComponent {
  @Input() merchant = '';
  @Input() amount = 0;
  @Output() regenerate = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
