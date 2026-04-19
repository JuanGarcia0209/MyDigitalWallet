import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { WalletCard, WalletTransaction } from 'src/app/core/models/app.models';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { CardService } from 'src/app/core/services/card.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
  standalone: false,
})
export class PaymentPage implements OnInit {
  cards: WalletCard[] = [];
  transactions: WalletTransaction[] = [];
  selectedCardId = '';
  selectedDay: string | null = null;
  merchant = '';
  amount = 0;
  showSimulatorModal = false;
  biometricRequired = false;

  reactionTarget?: WalletTransaction;
  showEmojiPicker = false;

  constructor(
    private readonly cardService: CardService,
    private readonly paymentService: PaymentService,
    private readonly biometricService: BiometricService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly toastService: ToastService,
    private readonly location: Location,
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.cardService.getMyCards().subscribe((cards) => {
      this.cards = cards;
      if (!this.selectedCardId && cards.length) {
        this.selectedCardId = cards[0].id || '';
      }
    });

    this.regenerateSimulation();
    void this.notificationService.initPush();
    this.loadTransactions();
    this.userService.getCurrentUserProfile().subscribe((user) => {
      this.biometricRequired = !!user?.quickBiometricEnabled;
    });
  }

  regenerateSimulation(): void {
    const simulation = this.paymentService.buildSimulation();
    this.merchant = simulation.merchant;
    this.amount = simulation.amount;
  }

  loadTransactions(): void {
    this.paymentService.getTransactions(this.selectedCardId || undefined, this.selectedDay || undefined).subscribe((txs) => {
      this.transactions = txs;
    });
  }

  onDateFilter(day: string | null): void {
    this.selectedDay = day;
    this.loadTransactions();
  }

  async processPayment(): Promise<void> {
    if (!this.selectedCardId) {
      await this.toastService.show('Selecciona una tarjeta');
      return;
    }

    const available = await this.biometricService.isAvailable();
    if (this.biometricRequired && available) {
      const validated = await this.biometricService.verifyIdentity('Autoriza el pago');
      if (!validated) {
        await this.toastService.show('Pago cancelado por autenticacion');
        return;
      }
    }

    try {
      await this.paymentService.processPayment(this.selectedCardId, this.merchant, this.amount);
      await this.notificationService.sendPaymentNotification(this.amount);
      await this.toastService.show('Pago realizado con exito');
      this.regenerateSimulation();
      this.showSimulatorModal = false;
    } catch {
      await this.toastService.show('No se pudo procesar el pago');
    }
  }

  openSimulatorModal(): void {
    this.showSimulatorModal = true;
  }

  closeSimulatorModal(): void {
    this.showSimulatorModal = false;
  }

  openEmojiPicker(tx: WalletTransaction): void {
    this.reactionTarget = tx;
    this.showEmojiPicker = true;
  }

  async onEmojiSelect(event: { emoji?: { native?: string } }): Promise<void> {
    const emoji = event.emoji?.native;
    if (!emoji || !this.reactionTarget?.id) {
      this.showEmojiPicker = false;
      return;
    }

    await this.paymentService.updateReaction(this.reactionTarget.id, emoji);
    this.showEmojiPicker = false;
  }
}
