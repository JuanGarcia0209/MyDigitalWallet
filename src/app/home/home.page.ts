import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AppUser, WalletCard, WalletTransaction } from 'src/app/core/models/app.models';
import { AuthService } from 'src/app/core/services/auth.service';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { CardService } from 'src/app/core/services/card.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { UserService } from 'src/app/core/services/user.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements AfterViewInit, OnDestroy {
  @ViewChild('switcherDeck', { read: ElementRef }) switcherDeck?: ElementRef<HTMLElement>;
  @ViewChild('ghostDeckCard', { read: ElementRef }) ghostDeckCard?: ElementRef<HTMLElement>;
  @ViewChild('currentDeckCard', { read: ElementRef }) currentDeckCard?: ElementRef<HTMLElement>;
  @ViewChild('nextDeckCard', { read: ElementRef }) nextDeckCard?: ElementRef<HTMLElement>;

  cards: WalletCard[] = [];
  balance = 0;
  loading = true;
  biometricEnabled = false;
  userFirstName = 'Usuario';
  userLastName = '';
  userInitials = 'U';
  profileModalOpen = false;
  cardSwitcherOpen = false;
  switcherDeckCards: WalletCard[] = [];
  deckGhostCard?: WalletCard;
  selectedCardId = '';
  selectedCard?: WalletCard;
  cardTransactions: WalletTransaction[] = [];
  currentUser?: AppUser;
  memberSinceLabel = '';
  isGoogleUser = false;
  private deckDragging = false;
  private deckAnimating = false;
  private deckDragStartX = 0;
  private deckDragDeltaX = 0;
  private suppressDeckTap = false;
  deckGhostDirection: 1 | -1 = -1;
  private readonly deckSwipeThreshold = 80;
  private biometricToggleBaseline = false;
  private historySubscription?: Subscription;

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
    private readonly paymentService: PaymentService,
    private readonly authService: AuthService,
    private readonly biometricService: BiometricService,
    private readonly userService: UserService,
    private readonly toastService: ToastService,
    private readonly alertController: AlertController,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
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
        this.rebuildSwitcherDeck();
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

  ngOnDestroy(): void {
    this.historySubscription?.unsubscribe();
  }

  goToAddCard(): void {
    void this.router.navigateByUrl('/add-card');
  }

  goToPayment(openSimulator = false): void {
    const cardId = this.selectedCardId || this.selectedCard?.id;
    const queryParams: { cardId?: string; openSimulator?: string } = {};
    if (cardId) {
      queryParams.cardId = cardId;
    }
    if (openSimulator) {
      queryParams.openSimulator = '1';
    }

    void this.router.navigate(['/payment'], {
      queryParams,
    });
  }

  async goToPaymentIfHasCards(): Promise<void> {
    if (!this.cards.length) {
      await this.toastService.show('Aun no has registrado una tarjeta. No es posible acceder a este apartado.');
      return;
    }

    this.goToPayment(true);
  }

  openCardSwitcher(): void {
    this.rebuildSwitcherDeck();
    this.cardSwitcherOpen = true;
    void this.animateSwitcherOpen();
  }

  closeCardSwitcher(): void {
    this.deckDragging = false;
    this.deckDragDeltaX = 0;
    this.suppressDeckTap = false;
    this.deckGhostCard = undefined;
    this.clearDeckInlineStyles();
    this.cardSwitcherOpen = false;
  }

  async chooseSwitcherCard(cardId: string): Promise<void> {
    const targetCard = this.cards.find((card) => card.id === cardId);
    if (!targetCard) {
      return;
    }

    this.selectedCardId = cardId;
    this.syncSelectedCard();
    this.rebuildSwitcherDeck();
    await this.animateSwitcherFocus();
    this.closeCardSwitcher();
  }

  get currentSwitcherCard(): WalletCard | undefined {
    return this.switcherDeckCards[0];
  }

  get nextSwitcherCard(): WalletCard | undefined {
    return this.switcherDeckCards[1];
  }

  async onDeckTouchStart(event: TouchEvent): Promise<void> {
    if (this.deckAnimating || !this.currentSwitcherCard || this.switcherDeckCards.length < 2) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    this.deckDragging = true;
    this.deckDragStartX = touch.clientX;
    this.deckDragDeltaX = 0;
    this.suppressDeckTap = false;
    this.clearDeckInlineStyles();
  }

  onDeckTouchMove(event: TouchEvent): void {
    if (!this.deckDragging || this.deckAnimating) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const rawDelta = touch.clientX - this.deckDragStartX;
    this.deckDragDeltaX = Math.max(-240, Math.min(240, rawDelta));
    if (Math.abs(this.deckDragDeltaX) > 10) {
      this.suppressDeckTap = true;
    }

    const current = this.currentDeckCard?.nativeElement;
    const next = this.nextDeckCard?.nativeElement;
    if (!current || !next) {
      return;
    }

    const progress = Math.min(1, Math.abs(this.deckDragDeltaX) / 160);
    const currentScale = 1 - 0.08 * progress;
    const currentRotate = this.deckDragDeltaX / 28;
    const nextScale = 0.9 + 0.1 * progress;
    const nextTranslateY = -18 + 18 * progress;
    const nextOpacity = 0.72 + 0.28 * progress;

    current.style.transform = `translateX(${this.deckDragDeltaX}px) rotate(${currentRotate}deg) scale(${currentScale})`;
    next.style.transform = `translateY(${nextTranslateY}px) scale(${nextScale})`;
    next.style.opacity = String(nextOpacity);
  }

  async onDeckTouchEnd(): Promise<void> {
    if (!this.deckDragging || this.deckAnimating) {
      return;
    }

    this.deckDragging = false;
    if (Math.abs(this.deckDragDeltaX) >= this.deckSwipeThreshold && this.switcherDeckCards.length > 1) {
      const direction = this.deckDragDeltaX >= 0 ? 1 : -1;
      await this.animateDeckSwap(direction);
      return;
    }

    await this.animateDeckReset();
  }

  async onDeckTouchCancel(): Promise<void> {
    this.deckDragging = false;
    if (this.deckAnimating) {
      return;
    }

    await this.animateDeckReset();
  }

  async chooseCurrentDeckCard(): Promise<void> {
    if (this.deckAnimating || this.suppressDeckTap || !this.currentSwitcherCard?.id) {
      return;
    }

    await this.chooseSwitcherCard(this.currentSwitcherCard.id);
  }

  async chooseNextDeckCard(): Promise<void> {
    if (this.deckAnimating || this.suppressDeckTap || !this.nextSwitcherCard?.id) {
      return;
    }

    await this.chooseSwitcherCard(this.nextSwitcherCard.id);
  }

  selectCard(cardId: string): void {
    this.selectedCardId = cardId;
    this.syncSelectedCard();
  }

  async editSelectedCard(): Promise<void> {
    if (!this.selectedCard?.id) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Editar tarjeta',
      message: 'Actualiza nombre del titular y fecha de vencimiento.',
      inputs: [
        {
          name: 'holderName',
          type: 'text',
          value: this.selectedCard.holderName,
          placeholder: 'Nombre del titular',
        },
        {
          name: 'expiry',
          type: 'text',
          value: this.selectedCard.expiry,
          placeholder: 'MM/YY',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', role: 'confirm' },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    if (result.role !== 'confirm') {
      return;
    }

    const holderName = String(result.data?.values?.holderName || '').trim();
    const expiry = String(result.data?.values?.expiry || '').trim();
    if (!holderName || !this.isValidExpiry(expiry)) {
      await this.toastService.show('Datos invalidos. Verifica nombre y fecha MM/YY vigente.');
      return;
    }

    try {
      await this.cardService.updateCard(this.selectedCard.id, { holderName, expiry });
      await this.toastService.show('Tarjeta actualizada');
    } catch {
      await this.toastService.show('No se pudo actualizar la tarjeta');
    }
  }

  async deleteSelectedCard(): Promise<void> {
    if (!this.selectedCard?.id) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar tarjeta',
      message: 'Esta accion no se puede deshacer. ¿Deseas continuar?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'confirm', cssClass: 'danger' },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    if (result.role !== 'confirm') {
      return;
    }

    try {
      await this.cardService.deleteCard(this.selectedCard.id);
      if (this.selectedCardId === this.selectedCard.id) {
        this.selectedCardId = '';
      }
      this.syncSelectedCard();
      await this.toastService.show('Tarjeta eliminada');
    } catch {
      await this.toastService.show('No se pudo eliminar la tarjeta');
    }
  }

  private syncSelectedCard(): void {
    const activeCard = this.cards.find((card) => card.id === this.selectedCardId) || this.cards[0];
    const activeId = activeCard?.id || '';
    const changed = this.selectedCard?.id !== activeId;

    this.selectedCard = activeCard;
    this.selectedCardId = activeId;

    if (changed) {
      this.subscribeToCardHistory();
    }
  }

  private subscribeToCardHistory(): void {
    this.historySubscription?.unsubscribe();

    const activeCardId = this.selectedCard?.id;
    if (!activeCardId) {
      this.cardTransactions = [];
      return;
    }

    this.historySubscription = this.paymentService.getTransactions(activeCardId).subscribe((transactions) => {
      this.cardTransactions = transactions.slice(0, 5);
    });
  }

  private rebuildSwitcherDeck(): void {
    if (!this.cards.length) {
      this.switcherDeckCards = [];
      return;
    }

    if (!this.switcherDeckCards.length) {
      const index = this.cards.findIndex((card) => card.id === this.selectedCardId);
      const start = index >= 0 ? index : 0;
      this.switcherDeckCards = [...this.cards.slice(start), ...this.cards.slice(0, start)];
      return;
    }

    const sourceById = new Map(this.cards.map((card) => [card.id || '', card]));
    const existingOrder = this.switcherDeckCards
      .map((card) => sourceById.get(card.id || ''))
      .filter((card): card is WalletCard => !!card);

    const existingIds = new Set(existingOrder.map((card) => card.id || ''));
    const newcomers = this.cards.filter((card) => !existingIds.has(card.id || ''));
    const merged = [...existingOrder, ...newcomers];

    if (!merged.length) {
      this.switcherDeckCards = [];
      return;
    }

    this.switcherDeckCards = this.rotateDeckToCardId(merged, this.selectedCardId);
  }

  private async animateSwitcherOpen(): Promise<void> {
    const deck = this.switcherDeck?.nativeElement;
    if (!deck) {
      return;
    }

    const current = this.currentDeckCard?.nativeElement;
    const next = this.nextDeckCard?.nativeElement;

    void import('animejs').then(({ animate }) => {
      if (next) {
        animate(next, {
          opacity: [0, 0.72],
          translateY: [8, -18],
          scale: [0.84, 0.9],
          duration: 360,
          easing: 'out(3)',
        });
      }

      if (current) {
        animate(current, {
          opacity: [0, 1],
          translateY: [18, 0],
          scale: [0.92, 1],
          duration: 420,
          easing: 'out(3)',
        });
      }
    });
  }

  private async animateSwitcherFocus(): Promise<void> {
    const deck = this.switcherDeck?.nativeElement;
    if (!deck) {
      return;
    }

    const active = deck.querySelector('.switcher-card.current-card');
    if (!active) {
      return;
    }

    void import('animejs').then(({ animate }) => {
      animate(active, {
        scale: [1, 1.04, 1],
        duration: 260,
        easing: 'inOut(2)',
      });
    });
  }

  private async animateDeckReset(): Promise<void> {
    const current = this.currentDeckCard?.nativeElement;
    const next = this.nextDeckCard?.nativeElement;
    if (!current) {
      return;
    }

    await import('animejs').then(({ animate }) => new Promise<void>((resolve) => {
      let completed = 0;
      const done = (): void => {
        completed += 1;
        if (completed >= (next ? 2 : 1)) {
          resolve();
        }
      };

      animate(current, {
        translateX: 0,
        rotate: 0,
        scale: 1,
        opacity: 1,
        duration: 220,
        easing: 'out(3)',
        complete: done,
      });

      if (next) {
        animate(next, {
          translateY: -18,
          scale: 0.9,
          opacity: 0.72,
          duration: 220,
          easing: 'out(3)',
          complete: done,
        });
      }
    }));

    this.deckDragDeltaX = 0;
    this.suppressDeckTap = false;
    this.clearDeckInlineStyles();
  }

  private async animateDeckSwap(direction: 1 | -1): Promise<void> {
    const currentCard = this.currentSwitcherCard;
    if (!currentCard || this.switcherDeckCards.length < 2) {
      return;
    }

    this.deckAnimating = true;
    this.deckDragging = false;
    this.deckGhostDirection = direction;
    this.deckGhostCard = currentCard;

    await this.ngZone.run(async () => {
      const [discarded, ...rest] = this.switcherDeckCards;
      this.switcherDeckCards = [...rest, discarded];
      this.selectedCardId = this.switcherDeckCards[0]?.id || this.selectedCardId;
      this.syncSelectedCard();
      this.cdr.detectChanges();
      await this.waitNextFrame();

      // IMMEDIATELY reset styles on the new current/next cards before animation starts
      const newCurrent = this.currentDeckCard?.nativeElement;
      const newNext = this.nextDeckCard?.nativeElement;
      if (newCurrent) {
        newCurrent.style.transform = 'scale(1) translateY(0)';
        newCurrent.style.opacity = '1';
      }
      if (newNext) {
        newNext.style.transform = 'translateY(-18px) scale(0.9)';
        newNext.style.opacity = '0.72';
      }
    });

    const ghost = this.ghostDeckCard?.nativeElement;
    const current = this.currentDeckCard?.nativeElement;
    if (!ghost || !current) {
      this.deckGhostCard = undefined;
      this.deckAnimating = false;
      this.deckDragDeltaX = 0;
      return;
    }

    const dragStart = this.deckDragDeltaX || direction * 28;

    await import('animejs').then(({ animate }) => new Promise<void>((resolve) => {
      let completed = 0;
      const done = (): void => {
        completed += 1;
        if (completed === 2) {
          resolve();
        }
      };

      animate(ghost, {
        translateX: [dragStart, direction * 320],
        rotate: [dragStart / 20, direction * 11],
        scale: [1, 0.9],
        opacity: [1, 0],
        duration: 280,
        easing: 'in(3)',
        complete: done,
      });

      animate(current, {
        translateY: [-18, 0],
        scale: [0.9, 1],
        opacity: [0.72, 1],
        duration: 280,
        easing: 'out(4)',
        complete: done,
      });
    }));

    this.deckGhostCard = undefined;
    this.deckDragDeltaX = 0;
    this.suppressDeckTap = false;
    this.cdr.detectChanges();
    this.deckAnimating = false;
  }

  private rotateDeckToCardId(deck: WalletCard[], cardId: string): WalletCard[] {
    if (!deck.length || !cardId) {
      return deck;
    }

    const index = deck.findIndex((card) => card.id === cardId);
    if (index <= 0) {
      return deck;
    }

    return [...deck.slice(index), ...deck.slice(0, index)];
  }

  private clearDeckInlineStyles(): void {
    const current = this.currentDeckCard?.nativeElement;
    const next = this.nextDeckCard?.nativeElement;
    const ghost = this.ghostDeckCard?.nativeElement;

    // Force the current card to its final state (no animations, just correct position)
    if (current) {
      current.style.transform = 'scale(1) translateY(0)';
      current.style.opacity = '1';
      // Force browser recalculation
      void current.offsetHeight;
    }

    // Force the next card to its correct position (behind, scaled)
    if (next) {
      next.style.transform = 'translateY(-18px) scale(0.9)';
      next.style.opacity = '0.72';
      void next.offsetHeight;
    }

    // Clear ghost card styles completely
    if (ghost) {
      ghost.style.transform = '';
      ghost.style.opacity = '';
    }
  }

  private waitNextFrame(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }

  private isValidExpiry(value: string): boolean {
    const match = value.match(/^(\d{2})\/(\d{2})$/);
    if (!match) {
      return false;
    }

    const month = Number(match[1]);
    const year = Number(match[2]);
    if (month < 1 || month > 12) {
      return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    return year > currentYear || (year === currentYear && month >= currentMonth);
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
