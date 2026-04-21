import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { WalletCard, WalletTransaction } from 'src/app/core/models/app.models';
import { AuthService } from 'src/app/core/services/auth.service';
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
  notificationDebugMessage = '';
  notificationDebugToken = '';

  reactionTarget?: WalletTransaction;
  showEmojiPicker = false;
  private preferredCardId = '';
  private shouldOpenSimulator = false;

  get selectedCard(): WalletCard | undefined {
    return this.cards.find((card) => card.id === this.selectedCardId);
  }

  constructor(
    private readonly authService: AuthService,
    private readonly cardService: CardService,
    private readonly paymentService: PaymentService,
    private readonly biometricService: BiometricService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly toastService: ToastService,
    private readonly alertController: AlertController,
    private readonly location: Location,
    private readonly route: ActivatedRoute,
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.preferredCardId = this.route.snapshot.queryParamMap.get('cardId') || '';
    this.shouldOpenSimulator = this.route.snapshot.queryParamMap.get('openSimulator') === '1';

    this.cardService.getMyCards().subscribe((cards) => {
      this.cards = cards;
      if (!cards.length) {
        this.selectedCardId = '';
        return;
      }

      if (this.preferredCardId && cards.some((card) => card.id === this.preferredCardId)) {
        this.selectedCardId = this.preferredCardId;
      } else if (!this.selectedCardId || !cards.some((card) => card.id === this.selectedCardId)) {
        this.selectedCardId = cards[0].id || '';
      }

      this.loadTransactions();
      if (this.shouldOpenSimulator) {
        this.showSimulatorModal = true;
        this.shouldOpenSimulator = false;
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

    const isGoogleUser = this.authService.isAuthenticatedWithGoogle();
    if (!isGoogleUser) {
      if (this.biometricRequired) {
        const available = await this.biometricService.isAvailable();
        if (!available) {
          await this.toastService.show('Biometria activada pero no disponible en este dispositivo');
          return;
        }

        const validated = await this.biometricService.verifyIdentity('Autoriza el pago');
        if (!validated) {
          await this.toastService.show('Pago cancelado por autenticacion biometrica');
          return;
        }
      } else {
        const password = await this.promptPaymentPassword();
        if (!password) {
          await this.toastService.show('Pago cancelado');
          return;
        }

        const email = this.authService.getCurrentEmail();
        if (!email) {
          await this.toastService.show('No se encontro el correo del usuario actual');
          return;
        }

        try {
          await this.authService.loginWithEmail(email, password);
        } catch (error) {
          await this.toastService.show(this.authService.getAuthErrorMessage(error));
          return;
        }
      }
    }

    try {
      await this.paymentService.processPayment(this.selectedCardId, this.merchant, this.amount);
      const notificationResult = await this.notificationService.sendPaymentNotification(this.amount);
      this.notificationDebugMessage = notificationResult.success
        ? ''
        : (notificationResult.debugDetails || notificationResult.errorMessage || 'Error desconocido');
      this.notificationDebugToken = notificationResult.success
        ? ''
        : (notificationResult.pushToken || 'No disponible');
      await this.toastService.show(
        notificationResult.success
          ? 'Pago realizado con exito'
          : `Pago realizado con exito, pero no se pudo enviar la notificacion: ${notificationResult.errorMessage || 'Error desconocido'}`,
      );
      if (notificationResult.success) {
        this.notificationDebugMessage = '';
        this.notificationDebugToken = '';
      }
      this.regenerateSimulation();
      this.showSimulatorModal = false;
    } catch {
      await this.toastService.show('No se pudo procesar el pago');
    }
  }

  private async promptPaymentPassword(): Promise<string | null> {
    const alert = await this.alertController.create({
      header: 'Confirmar pago',
      message: 'Ingresa tu contraseña para autorizar esta transacción.',
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: 'Contraseña',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', role: 'confirm' },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    if (result.role !== 'confirm') {
      return null;
    }

    const password = String(result.data?.values?.password || '').trim();
    return password || null;
  }

  async copyNotificationDebugMessage(): Promise<void> {
    if (!this.notificationDebugMessage) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.notificationDebugMessage);
      await this.toastService.show('Mensaje de error copiado');
    } catch {
      await this.toastService.show('No se pudo copiar el mensaje');
    }
  }

  async copyNotificationDebugToken(): Promise<void> {
    if (!this.notificationDebugToken || this.notificationDebugToken === 'No disponible') {
      await this.toastService.show('No hay token FCM para copiar');
      return;
    }

    try {
      await navigator.clipboard.writeText(this.notificationDebugToken);
      await this.toastService.show('Token FCM copiado');
    } catch {
      await this.toastService.show('No se pudo copiar el token');
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

  closeEmojiPicker(): void {
    this.showEmojiPicker = false;
  }

  async onEmojiSelect(event: { emoji?: { native?: string } }): Promise<void> {
    const emoji = event.emoji?.native;
    if (!emoji || !this.reactionTarget?.id) {
      this.closeEmojiPicker();
      return;
    }

    await this.paymentService.updateReaction(this.reactionTarget.id, emoji);
    this.closeEmojiPicker();
  }
}
