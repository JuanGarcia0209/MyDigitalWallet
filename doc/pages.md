# Pages

Referencia tecnica de paginas en src/app/pages/.

## 1) add-card.page.ts

### AddCardPage
Contexto: alta de tarjeta con preview animada y validacion local.

#### constructor(...)
Responsabilidad:
- Construir formulario reactivo.
- Suscribirse a valueChanges para mantener preview sincronizada.

#### ngAfterViewInit()
Retorno:
- void.

Efecto:
- Ejecuta animatePreviewEnter() cuando existe el nodo visual.

#### ngOnDestroy()
Efecto:
- formSub.unsubscribe().

#### goBack()
Efecto:
- Location.back().

#### onCardInput(event)
Entrada:
- evento input.

Proceso:
1. Formatea numero con cardService.
2. Detecta brand.
3. Actualiza preview y pulso.

#### onExpiryInput(event)
Proceso:
- Formatea MM/YY y actualiza preview.

#### onCvcInput(event)
Proceso:
- Conserva solo digitos y max 4.

#### save()
Firma:
- save(): Promise<void>

Flujo:
1. Valida formulario.
2. Valida Luhn.
3. show loading.
4. createCard.
5. haptics light + toast exito + navigate home.
6. hide loading (finally).

Errores:
- Datos invalidos o fallo de persistencia muestran toast.

#### animatePreviewEnter()
Privado:
- Animacion inicial de opacidad, translate y escala.

#### animatePreviewPulse()
Privado:
- Microanimacion en cada cambio de formulario.

---

## 2) login.page.ts

### LoginPage
Contexto: autenticacion email/password, biometrica y Google.

#### constructor(...)
Dependencias:
- authService, biometricService, loadingService, toastService, router.

#### login()
Firma:
- login(): Promise<void>

Flujo:
1. Valida form.
2. show loading.
3. loginWithEmail.
4. haptics light.
5. redireccion a /home (replaceUrl).
6. hide loading.

#### loginWithBiometric()
Flujo:
1. Valida disponibilidad biometrica.
2. verifyIdentity.
3. Recupera credenciales seguras.
4. Inyecta credenciales en form.
5. Reusa login().

#### loginGoogle()
Flujo:
1. show loading.
2. loginWithGoogle.
3. Si needsProfileCompletion -> navigate /register con query params.
4. Si perfil completo -> toast + haptics + navigate /home.
5. hide loading.

---

## 3) payment.page.ts

### PaymentPage
Contexto: historial, filtro por fecha, simulador de pago y reacciones emoji.

#### constructor(...)
Dependencias clave:
- cardService, paymentService, biometricService, loadingService, notificationService, router.

#### goBack()
Efecto:
- Navegacion inversa via Location.back().

#### ngOnInit()
Flujo:
1. Lee query params cardId/openSimulator.
2. Carga tarjetas y decide selectedCardId.
3. loadTransactions().
4. Si openSimulator=1, abre modal al iniciar.
5. initPush().
6. Lee quickBiometricEnabled del perfil.

#### regenerateSimulation()
Retorno:
- void.

Efecto:
- merchant y amount nuevos desde paymentService.buildSimulation().

#### loadTransactions()
Efecto:
- Suscribe transacciones por selectedCardId + selectedDay.

#### onDateFilter(day)
Efecto:
- Actualiza selectedDay y recarga listado.

#### processPayment()
Firma:
- processPayment(): Promise<void>

Reglas de autorizacion:
1. Sin tarjeta => toast + return.
2. Usuario Google o biometria activa => verifyIdentity obligatorio.
3. Caso contrario => solicita password y revalida sesion con loginWithEmail.

Flujo de ejecucion:
1. show loading.
2. processPayment en servicio.
3. Envio de push notification.
4. Toast de resultado (con fallback si push falla).
5. regenerateSimulation().
6. Cierra modal.
7. Navega a /payment con replaceUrl y cardId.
8. hide loading en finally.

#### promptPaymentPassword()
Retorno:
- Promise<string | null>.

Semantica:
- null cuando cancela o input vacio.

#### openSimulatorModal()
Efecto:
- showSimulatorModal = true.

#### closeSimulatorModal()
Efecto:
- showSimulatorModal = false.

#### closeSimulatorAndGoHome()
Flujo:
1. Cierra modal.
2. Redirige a /home con replaceUrl.

#### openEmojiPicker(tx)
Flujo:
1. Guarda transaccion objetivo.
2. Cancela timeout previo si existe.
3. Abre picker tras 100ms para evitar taps accidentales.

#### closeEmojiPicker()
Efecto:
- Limpia timeout pendiente y oculta picker.

#### onEmojiSelect(event)
Flujo:
1. Valida emoji y reactionTarget.
2. show loading.
3. updateReaction.
4. haptics light.
5. cierra picker.
6. hide loading.

---

## 4) register.page.ts

### RegisterPage
Contexto: alta de usuario tradicional y completado post-login Google.

#### constructor(...)
Dependencias:
- authService, loadingService, toastService, route, router.

#### ngOnInit()
Flujo:
1. Lee mode query param.
2. Si google-complete, precarga firstName/lastName/email.
3. Deshabilita email.
4. Elimina validadores de password para este modo.

#### cancelRegistration()
Reglas:
- Si google-complete: logout().
- Caso normal: navigate /login replaceUrl.

#### register()
Firma:
- register(): Promise<void>

Flujo:
1. Valida form.
2. show loading.
3. Si google-complete -> completeGoogleProfile.
4. Si normal -> registerWithEmail.
5. Toast exito.
6. Haptics light.
7. Navigate /home replaceUrl.
8. hide loading.
