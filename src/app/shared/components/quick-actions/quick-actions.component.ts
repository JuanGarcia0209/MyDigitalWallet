import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss'],
  standalone: false,
})
export class QuickActionsComponent {
  @Output() transfer = new EventEmitter<void>();
  @Output() recharge = new EventEmitter<void>();
  @Output() pay = new EventEmitter<void>();
}
