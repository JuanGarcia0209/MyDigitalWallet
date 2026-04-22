# Home Page

Referencia tecnica de src/app/home/home.page.ts.

## HomePage

### constructor(...)
Firma:
- constructor(fb, cardService, paymentService, authService, biometricService, userService, toastService, alertController, ngZone, cdr, router)

Responsabilidades:
1. Inicializa estado reactivo del home.
2. Suscribe tarjetas del usuario para:
- calcular balance,
- resolver tarjeta activa,
- reconstruir deck del selector,
- habilitar render de historial.
3. Suscribe perfil de usuario para:
- nombre/iniciales,
- bandera biometrica,
- rellenar formulario de perfil.

Efectos secundarios:
- Actualiza propiedades de UI en tiempo real por cambios de Firestore.

### ngAfterViewInit()
Firma:
- ngAfterViewInit(): void

Proceso:
1. Carga animejs en lazy import.
2. Ejecuta animacion de entrada sobre .hero-card, .action-tile y .history-card.

### ngOnDestroy()
Firma:
- ngOnDestroy(): void

Efectos:
- Cancela historySubscription para prevenir memory leaks.

### goToAddCard()
Firma:
- goToAddCard(): void

Efecto:
- Navega a /add-card.

### goToPayment(openSimulator = false)
Firma:
- goToPayment(openSimulator?: boolean): void

Parametros:
- openSimulator: si true envia query param openSimulator=1.

Proceso:
1. Lee selectedCardId o selectedCard.id.
2. Construye query params condicionales.
3. Navega a /payment.

### goToPaymentIfHasCards()
Firma:
- goToPaymentIfHasCards(): Promise<void>

Reglas:
1. Si cards.length === 0, muestra toast y no navega.
2. Si hay tarjetas, llama goToPayment(true).

### openCardSwitcher()
Firma:
- openCardSwitcher(): void

Proceso:
1. rebuildSwitcherDeck().
2. Abre modal.
3. Dispara animateSwitcherOpen().

### closeCardSwitcher()
Firma:
- closeCardSwitcher(): void

Efectos:
- Resetea drag state, limpia ghost card, limpia estilos inline, cierra modal.

### chooseSwitcherCard(cardId)
Firma:
- chooseSwitcherCard(cardId: string): Promise<void>

Parametros:
- cardId: id destino del deck.

Proceso:
1. Valida existencia de tarjeta.
2. Ejecuta Haptics impact light.
3. Actualiza selectedCardId.
4. syncSelectedCard() + rebuildSwitcherDeck().
5. animateSwitcherFocus() y cierre modal.

### currentSwitcherCard
Firma:
- get currentSwitcherCard(): WalletCard | undefined

Retorno:
- Primer elemento del deck (tarjeta frontal).

### nextSwitcherCard
Firma:
- get nextSwitcherCard(): WalletCard | undefined

Retorno:
- Segundo elemento del deck (tarjeta siguiente).

### onDeckTouchStart(event)
Firma:
- onDeckTouchStart(event: TouchEvent): Promise<void>

Guardas:
- No inicia si hay animacion activa, no hay card actual o hay menos de 2 tarjetas.

Efectos:
- Inicializa variables de arrastre y limpia estilos previos.

### onDeckTouchMove(event)
Firma:
- onDeckTouchMove(event: TouchEvent): void

Proceso:
1. Calcula delta X limitado.
2. Marca suppressDeckTap si supera tolerancia.
3. Aplica transformaciones en vivo a tarjeta actual y siguiente (translate/rotate/scale/opacity).

### onDeckTouchEnd()
Firma:
- onDeckTouchEnd(): Promise<void>

Reglas:
- Si supera umbral deckSwipeThreshold, llama animateDeckSwap(direction).
- Si no, llama animateDeckReset().

### onDeckTouchCancel()
Firma:
- onDeckTouchCancel(): Promise<void>

Efecto:
- Cancela drag y restaura posicion visual si corresponde.

### chooseCurrentDeckCard()
Firma:
- chooseCurrentDeckCard(): Promise<void>

Guardas:
- Ignora tap con animacion activa o tap suprimido por gesto.

### chooseNextDeckCard()
Firma:
- chooseNextDeckCard(): Promise<void>

Comportamiento:
- Igual a chooseCurrentDeckCard, pero apunta a nextSwitcherCard.

### selectCard(cardId)
Firma:
- selectCard(cardId: string): void

Efecto:
- Asigna selectedCardId y sincroniza selectedCard.

### editSelectedCard()
Firma:
- editSelectedCard(): Promise<void>

Proceso:
1. Abre alert con holderName/expiry.
2. Valida confirmacion y formato de campos.
3. Ejecuta cardService.updateCard.
4. Haptics light en exito + toast.

Errores:
- Si validacion falla: toast de datos invalidos.
- Si update falla: toast de error.

### deleteSelectedCard()
Firma:
- deleteSelectedCard(): Promise<void>

Proceso:
1. Solicita confirmacion destructiva.
2. Elimina tarjeta.
3. Repara selectedCardId si borro la activa.
4. syncSelectedCard() + haptics + toast.

### syncSelectedCard()
Firma:
- syncSelectedCard(): void

Responsabilidad:
- Resolver tarjeta activa valida segun cards y selectedCardId.
- Disparar subscribeToCardHistory() solo si cambia la tarjeta activa.

### subscribeToCardHistory()
Firma:
- subscribeToCardHistory(): void

Proceso:
1. Cancela suscripcion previa.
2. Si no hay activeCardId, limpia cardTransactions.
3. Si hay activeCardId, suscribe paymentService.getTransactions(activeCardId).
4. Mantiene slice(0, 5) para preview en home.

### rebuildSwitcherDeck()
Firma:
- rebuildSwitcherDeck(): void

Reglas:
1. Si no hay tarjetas, deck vacio.
2. Si deck vacio inicial, rota segun selectedCardId.
3. Si deck existente, conserva orden previo valido y agrega nuevas tarjetas.

### animateSwitcherOpen()
Firma:
- animateSwitcherOpen(): Promise<void>

Efecto:
- Anima current y next card con entrada escalonada.

### animateSwitcherFocus()
Firma:
- animateSwitcherFocus(): Promise<void>

Efecto:
- Pulso visual de confirmacion de tarjeta activa.

### animateDeckReset()
Firma:
- animateDeckReset(): Promise<void>

Efecto:
- Revierte transformaciones a estado base.

### animateDeckSwap(direction)
Firma:
- animateDeckSwap(direction: 1 | -1): Promise<void>

Proceso:
1. Determina tarjeta entrante/saliente.
2. Ejecuta animaciones de salida/entrada.
3. Reordena deck.
4. Actualiza seleccion e historial.

### rotateDeckToCardId(deck, cardId)
Firma:
- rotateDeckToCardId(deck: WalletCard[], cardId: string): WalletCard[]

Retorno:
- Nuevo arreglo con cardId en posicion cero cuando existe.

### clearDeckInlineStyles()
Firma:
- clearDeckInlineStyles(): void

Responsabilidad:
- Remover estilos inline residuales para evitar trabas visuales post-gesture.

### waitNextFrame()
Firma:
- waitNextFrame(): Promise<void>

Uso:
- Coordinar secuencias de animacion garantizando repintado del DOM.

### isValidExpiry(value)
Firma:
- isValidExpiry(value: string): boolean

Validaciones:
1. Regex MM/YY.
2. Mes 1..12.
3. Fecha no vencida.

### comingSoon(feature)
Firma:
- comingSoon(feature: string): Promise<void>

Efecto:
- Toast informativo de funcionalidad pendiente.

### logout()
Firma:
- logout(): Promise<void>

Efecto:
- Delega cierre de sesion en authService.

### openProfileModal()
Firma:
- openProfileModal(): void

Proceso:
- Sincroniza form con estado visible del perfil y abre modal.

### closeProfileModal()
Firma:
- closeProfileModal(): void

Efecto:
- Cierra modal de perfil.

### saveProfile()
Firma:
- saveProfile(): Promise<void>

Proceso:
1. Valida formulario.
2. Ejecuta userService.updateProfile.
3. Refresca flags locales de biometria.
4. Cierra modal + haptics + toast.

### onBiometricToggleChange(event)
Firma:
- onBiometricToggleChange(event: CustomEvent<{ checked: boolean }>): Promise<void>

Reglas:
1. Si no cambia respecto a baseline, no hace nada.
2. Si activa: ejecuta enrollBiometricCredentials().
3. Si desactiva: verifyIdentity + clearCredentials + updateProfile(false).
4. En fallo, revierte toggle y muestra toast.

### enrollBiometricCredentials()
Firma:
- enrollBiometricCredentials(): Promise<boolean>

Flujo:
1. Solicita password.
2. Valida password con loginWithEmail.
3. Verifica identidad biometrica.
4. Guarda credenciales seguras.
5. Actualiza preferencia de perfil.

Retorno:
- true si completa el enrolamiento.
- false si cancela o falla validacion.

### enableBiometricQuickAccess()
Firma:
- enableBiometricQuickAccess(): Promise<void>

Objetivo:
- Flujo alterno/manual para habilitar acceso rapido biometrico desde home.
