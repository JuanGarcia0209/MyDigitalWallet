import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-balance-display',
  templateUrl: './balance-display.component.html',
  styleUrls: ['./balance-display.component.scss'],
  standalone: false,
})
export class BalanceDisplayComponent {
  @Input() balance = 0;
  hidden = false;

  toggle(): void {
    this.hidden = !this.hidden;
  }
}
