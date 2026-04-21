import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss'],
  standalone: false,
})
export class QuickActionsComponent {
  @Output() cambiarTarjeta = new EventEmitter<void>();
  @Output() realizarPago = new EventEmitter<void>();
  @Output() agregarTarjeta = new EventEmitter<void>();
}
