import { Component, Input } from '@angular/core';
import { WalletCard } from 'src/app/core/models/app.models';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  standalone: false,
})
export class CardComponent {
  @Input({ required: true }) card!: WalletCard;
}
