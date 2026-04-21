import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { WalletCard } from 'src/app/core/models/app.models';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  standalone: false,
})
export class CardComponent implements AfterViewInit, OnChanges {
  @ViewChild('cardElement', { read: ElementRef }) cardElement?: ElementRef<HTMLElement>;
  @Input({ required: true }) card!: WalletCard;
  @Input() showActions = true;
  @Output() editCard = new EventEmitter<void>();
  @Output() deleteCard = new EventEmitter<void>();

  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.animateCard();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['card'] && this.viewReady) {
      this.animateCard();
    }
  }

  private animateCard(): void {
    const element = this.cardElement?.nativeElement;
    if (!element) {
      return;
    }

    void import('animejs').then(({ animate }) => {
      animate(element, {
        opacity: [0.75, 1],
        translateY: [16, 0],
        scale: [0.97, 1],
        rotateX: [6, 0],
        duration: 520,
        easing: 'out(4)',
      });
    });
  }

  get brandLabel(): string {
    if (this.card.brand === 'visa') {
      return 'VISA';
    }

    if (this.card.brand === 'mastercard') {
      return 'MASTERCARD';
    }

    return 'TARJETA';
  }
}
