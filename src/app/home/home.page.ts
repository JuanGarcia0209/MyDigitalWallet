import { AfterViewInit, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AppUser, WalletCard } from 'src/app/core/models/app.models';
import { AuthService } from 'src/app/core/services/auth.service';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { CardService } from 'src/app/core/services/card.service';
import { UserService } from 'src/app/core/services/user.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements AfterViewInit {
  cards: WalletCard[] = [];
  balance = 0;
  loading = true;
  biometricEnabled = false;
  userFirstName = 'Usuario';
  userLastName = '';
  userInitials = 'U';
  profileModalOpen = false;
  cardSwitcherOpen = false;
  selectedCardId = '';
  selectedCard?: WalletCard;
  currentUser?: AppUser;
  memberSinceLabel = '';
  isGoogleUser = false;
  private biometricToggleBaseline = false;

  readonly profileForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    documentType: [{ value: 'CC', disabled: true }],
    documentNumber: [{ value: '', disabled: true }],
    country: [{ value: 'CO', disabled: true }],
    email: [{ value: '', disabled: true }],
    biometricEnabled: [false],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly cardService: CardService,
    private readonly authService: AuthService,
    private readonly biometricService: BiometricService,
    private readonly userService: UserService,
    private readonly toastService: ToastService,
    private readonly alertController: AlertController,
    private readonly router: Router,
  ) {
    this.cardService
      .getMyCards()
      .pipe(map((cards) => cards || []))
      .subscribe((cards) => {
        this.cards = cards;
        this.balance = cards.length * 350000;
        this.loading = false;

        if (cards.length && !this.selectedCardId) {
          this.selectedCardId = cards[0].id || '';
        }

        this.syncSelectedCard();
      });

    this.userService.getCurrentUserProfile().subscribe((user) => {
      this.currentUser = user;
      this.isGoogleUser = this.authService.isAuthenticatedWithGoogle();
      this.biometricEnabled = !!user?.quickBiometricEnabled;
      this.biometricToggleBaseline = !!user?.quickBiometricEnabled;
      this.userFirstName = user?.firstName?.trim() || 'Usuario';
      this.userLastName = user?.lastName?.trim() || '';
      const first = user?.firstName?.trim().charAt(0) || 'U';
      const last = user?.lastName?.trim().charAt(0) || '';
      this.userInitials = `${first}${last}`.toUpperCase();
      this.memberSinceLabel = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'Sin fecha';

      this.profileForm.patchValue({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        documentType: user?.documentType || 'CC',
        documentNumber: user?.documentNumber || '',
        country: user?.country || 'CO',
        email: user?.email || '',
        biometricEnabled: !!user?.quickBiometricEnabled,
      }, { emitEvent: false });
    });
  }

  ngAfterViewInit(): void {
    void import('animejs').then(({ animate, stagger }) => {
      animate('.hero-card, .action-tile, .history-card', {
        translateY: [18, 0],
        opacity: [0, 1],
        delay: stagger(70),
        duration: 420,
        easing: 'out(3)',
      });
    });
  }

  goToAddCard(): void {
    void this.router.navigateByUrl('/add-card');
  }

  goToPayment(): void {
    void this.router.navigateByUrl('/payment');
  }

  openCardSwitcher(): void {
    this.cardSwitcherOpen = true;
  }

  closeCardSwitcher(): void {
    this.cardSwitcherOpen = false;
  }

  selectCard(cardId: string): void {
    this.selectedCardId = cardId;
    this.syncSelectedCard();
  }

  private syncSelectedCard(): void {
    this.selectedCard = this.cards.find((card) => card.id === this.selectedCardId) || this.cards[0];
  }

  async comingSoon(feature: string): Promise<void> {
    await this.toastService.show(`${feature} estara disponible pronto`);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  openProfileModal(): void {
    this.profileForm.patchValue({
      firstName: this.userFirstName,
      lastName: this.userLastName,
      biometricEnabled: this.biometricEnabled,
    }, { emitEvent: false });
    this.profileModalOpen = true;
  }

  closeProfileModal(): void {
    this.profileModalOpen = false;
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const raw = this.profileForm.getRawValue();
    try {
      await this.userService.updateProfile({
        firstName: raw.firstName || '',
        lastName: raw.lastName || '',
        quickBiometricEnabled: !!raw.biometricEnabled,
      });
      this.biometricEnabled = !!raw.biometricEnabled;
      this.biometricToggleBaseline = !!raw.biometricEnabled;
      this.profileModalOpen = false;
      await this.toastService.show('Perfil actualizado');
    } catch {
      await this.toastService.show('No se pudo actualizar el perfil');
    }
  }

  async onBiometricToggleChange(event: CustomEvent<{ checked: boolean }>): Promise<void> {
    const targetEnabled = !!event.detail.checked;
    if (targetEnabled === this.biometricToggleBaseline) {
      return;
    }

    const available = await this.biometricService.isAvailable();
    if (!available) {
      this.profileForm.controls.biometricEnabled.setValue(this.biometricToggleBaseline, { emitEvent: false });
      await this.toastService.show('Biometria no disponible en este dispositivo');
      return;
    }

    if (targetEnabled) {
      // Activar biometría: primero contraseña, luego huella
      const enrolled = await this.enrollBiometricCredentials();
      if (!enrolled) {
        this.profileForm.controls.biometricEnabled.setValue(false, { emitEvent: false });
        return;
      }
    } else {
      // Desactivar biometría: verificar identidad
      const verified = await this.biometricService.verifyIdentity('Confirma tu identidad para desactivar biometria');
      if (!verified) {
        this.profileForm.controls.biometricEnabled.setValue(this.biometricToggleBaseline, { emitEvent: false });
        await this.toastService.show('No se pudo validar tu identidad');
        return;
      }
      try {
        await this.biometricService.clearCredentials();

        // Actualizar Firestore
        await this.userService.updateProfile({
          firstName: this.userFirstName,
          lastName: this.userLastName,
          quickBiometricEnabled: false,
        });

        // Actualizar estado local
        this.biometricEnabled = false;
        this.biometricToggleBaseline = false;
        this.profileForm.controls.biometricEnabled.setValue(false, { emitEvent: false });

        await this.toastService.show('Biometría desactivada');
      } catch {
        this.profileForm.controls.biometricEnabled.setValue(this.biometricToggleBaseline, { emitEvent: false });
        await this.toastService.show('Error al desactivar biometría');
      }
    }
  }

  private async enrollBiometricCredentials(): Promise<boolean> {
    const email = this.authService.getCurrentEmail();
    if (!email) {
      await this.toastService.show('No se encontro el correo del usuario actual');
      return false;
    }

    // Paso 1: Pedir contraseña
    const alert = await this.alertController.create({
      header: 'Vincular biometria',
      message: 'Ingresa tu contraseña para completar el enrolamiento seguro.',
      inputs: [{ name: 'password', type: 'password', placeholder: 'Contraseña' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Siguiente', role: 'confirm' },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    const password = result.data?.values?.password as string | undefined;
    if (!password) {
      await this.toastService.show('Enrolamiento cancelado');
      return false;
    }

    // Validar contraseña
    try {
      await this.authService.loginWithEmail(email, password);
    } catch {
      await this.toastService.show('Contraseña incorrecta');
      return false;
    }

    // Paso 2: Pedir huella después de validar contraseña
    const verified = await this.biometricService.verifyIdentity('Coloca tu huella para completar el enrolamiento');
    if (!verified) {
      await this.toastService.show('No se pudo registrar tu huella');
      return false;
    }

    // Guardar credenciales
    try {
      await this.biometricService.storeCredentials(email, password);

      // Actualizar Firestore
      await this.userService.updateProfile({
        firstName: this.userFirstName,
        lastName: this.userLastName,
        quickBiometricEnabled: true,
      });

      // Actualizar estado local
      this.biometricEnabled = true;
      this.biometricToggleBaseline = true;
      this.profileForm.controls.biometricEnabled.setValue(true, { emitEvent: false });

      await this.toastService.show('Biometría activada correctamente');
      return true;
    } catch {
      await this.toastService.show('Error al guardar credenciales');
      return false;
    }
  }

  async enableBiometricQuickAccess(): Promise<void> {
    const email = this.authService.getCurrentEmail();
    if (!email) {
      await this.toastService.show('No se encontro el correo del usuario actual');
      return;
    }

    const available = await this.biometricService.isAvailable();
    if (!available) {
      await this.toastService.show('Biometria no disponible en este dispositivo');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Activar biometria',
      message: 'Confirma tu contrasena para habilitar acceso rapido.',
      inputs: [{ name: 'password', type: 'password', placeholder: 'Contrasena' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Activar', role: 'confirm' },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    const password = result.data?.values?.password as string | undefined;
    if (!password) {
      return;
    }

    try {
      await this.authService.loginWithEmail(email, password);
      await this.biometricService.storeCredentials(email, password);
      await this.userService.updateBiometricPreference(true);
      await this.toastService.show('Biometria habilitada correctamente');
    } catch {
      await this.toastService.show('No se pudo validar la contrasena');
    }
  }

}
