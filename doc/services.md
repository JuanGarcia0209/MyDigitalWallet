# Services

Referencia tecnica de servicios en src/app/core/services/.

## 1) auth.service.ts

### AuthService
Dominio: autenticacion Firebase (email/password y Google), estado de sesion, perfil inicial.

#### registerWithEmail(data)
Contrato:
- Entrada: firstName, lastName, documentType, documentNumber, country, email, password.
- Salida: Promise<void>.

Proceso:
1. Crea usuario en Firebase Auth con email/password.
2. Persiste perfil base en coleccion users.
3. Inicializa quickBiometricEnabled en false.

Errores:
- Propaga errores de Firebase (email en uso, password debil, red, etc.).

#### loginWithEmail(email, password)
Contrato:
- Entrada: credenciales.
- Salida: Promise<void>.

Proceso:
1. Ejecuta signInWithEmailAndPassword.
2. Actualiza estado de sesion observado por isLoggedIn$.

#### loginWithGoogle()
Contrato:
- Entrada: ninguna.
- Salida: Promise<{ needsProfileCompletion: boolean; profile: ... }>.

Proceso:
1. Resuelve flujo nativo/web de Google.
2. Verifica existencia de perfil en users.
3. Retorna bandera de completado para decidir navegacion.

#### completeGoogleProfile(data)
Contrato:
- Entrada: perfil complementario sin password.
- Salida: Promise<void>.

Proceso:
1. Toma uid actual autenticado.
2. Completa documento users/{uid}.

#### logout()
Contrato:
- Salida: Promise<void>.

Efectos:
- Cierra sesion Firebase.
- Limpia estado de autenticacion observado por guards.

#### getCurrentUid()
Retorno:
- string | null.

#### getCurrentEmail()
Retorno:
- string | null.

#### isAuthenticatedWithGoogle()
Retorno:
- boolean (providerId Google detectado en usuario actual).

#### getAuthErrorMessage(error)
Responsabilidad:
- Mapear codigos tecnicos de Firebase a mensajes legibles para UI.

---

## 2) biometric.service.ts

### BiometricService
Dominio: acceso biometrico y almacenamiento seguro de credenciales.

#### isAvailable()
Retorno:
- Promise<boolean>.

Uso:
- Pre-check antes de solicitar verifyIdentity.

#### verifyIdentity(reason)
Contrato:
- Entrada: reason (texto del prompt).
- Salida: Promise<boolean>.

Efectos:
- Abre prompt nativo (huella/face/pin del dispositivo).

#### storeCredentials(username, password)
Contrato:
- Guarda secreto en almacenamiento seguro nativo.

#### getCredentials()
Retorno:
- Promise<{ username: string; password: string } | null>.

#### clearCredentials()
Responsabilidad:
- Eliminar credenciales biometrico-rapidas sin fallar si no existen.

---

## 3) card.service.ts

### CardService
Dominio: formateo, validacion y CRUD de tarjetas.

#### formatCardNumber(value)
Retorno:
- string formateado en grupos de 4 digitos.

Reglas:
- Elimina no digitos.
- Limita longitud al maximo esperado.

#### formatExpiry(value)
Retorno:
- string MM/YY.

#### detectBrand(cardNumber)
Retorno:
- 'visa' | 'mastercard' | 'unknown'.

#### isValidLuhn(cardNumber)
Retorno:
- boolean.

#### createCard(data)
Contrato:
- Entrada: holderName, cardNumber, expiry.
- Salida: Promise<string> id creado.

Efectos:
- Deriva maskedNumber.
- Guarda brand detectada.

#### updateCard(cardId, data)
Contrato:
- Entrada: cardId + campos editables.
- Salida: Promise<void>.

#### deleteCard(cardId)
Contrato:
- Entrada: cardId.
- Salida: Promise<void>.

#### getMyCards()
Retorno:
- Observable<WalletCard[]> ordenado de reciente a antiguo.

---

## 4) dialog.service.ts

### DialogService
Responsabilidad: wrapper de confirmaciones UI.

#### confirm(header, message)
Contrato:
- Entrada: textos del dialog.
- Salida: Promise<boolean>.

Semantica:
- true cuando el usuario confirma.
- false cuando cancela o cierra.

---

## 5) firestore.service.ts

### FirestoreService
Capa de acceso generica para colecciones/documentos.

#### add(path, data)
Retorno:
- Promise<string> id generado.

#### set(path, id, data)
Retorno:
- Promise<void>.

Semantica:
- merge habilitado para no sobreescribir campos no enviados.

#### update(path, id, data)
Retorno:
- Promise<void>.

#### delete(path, id)
Retorno:
- Promise<void>.

#### getDoc(path, id)
Retorno:
- Observable<T | undefined>.

#### getCollection(path)
Retorno:
- Observable<T[]>.

#### getCollectionWhere(path, field, value)
Retorno:
- Observable<T[]> filtrado por igualdad.

---

## 6) http.service.ts

### HttpService
Responsabilidad: wrapper minimo de POST.

#### post(url, body, token)
Contrato:
- Entrada: url, body, token opcional.
- Salida: Observable/Promise segun implementacion concreta del servicio.

Detalles:
- Si token existe, envia Authorization bearer.

---

## 7) loading.service.ts

### LoadingService
Responsabilidad: overlay global de espera.

Estado interno:
- loading?: HTMLIonLoadingElement.

#### show(message = 'Cargando...')
Contrato:
- Entrada: mensaje opcional.
- Salida: Promise<void>.

Reglas:
- Si ya hay loading visible, no crea otro (anti-duplicado).

Uso actual:
- Login email/google, registro, agregar tarjeta, procesar pago, guardar reaccion emoji.

#### hide()
Contrato:
- Salida: Promise<void>.

Reglas:
- Si no hay loading activo, no hace nada.
- Si existe, dismiss + limpia referencia.

---

## 8) modal.service.ts

### ModalService
Responsabilidad: utilitario para abrir/cerrar modales Ionic.

#### open(component, componentProps)
Retorno:
- Promise<HTMLIonModalElement>.

#### close(data)
Retorno:
- Promise<void>.

---

## 9) notification.service.ts

### NotificationService
Dominio: push notifications y notificacion de pago.

#### initPush()
Proceso:
1. Solicita permisos.
2. Registra listeners de token/errores.
3. Ejecuta registro del dispositivo.

Salida:
- Promise<void>.

#### sendPaymentNotification(amount)
Contrato:
- Entrada: amount numerico.
- Salida: Promise<{ success: boolean; errorMessage?: string }>.

Proceso:
1. Obtiene token push (waitForPushToken).
2. Construye payload de pago exitoso.
3. Invoca endpoint remoto de envio.

#### waitForPushToken(timeoutMs)
Retorno:
- Promise<string | null> segun disponibilidad y timeout.

#### formatErrorMessage(error)
Retorno:
- string legible para usuario/soporte.

#### serializeError(error)
Retorno:
- string diagnostico (stack/data/codigo cuando existe).

---

## 10) payment.service.ts

### PaymentService
Dominio: simulacion y persistencia de transacciones.

#### buildSimulation()
Retorno:
- { merchant: string; amount: number }.

Fuente:
- Faker para comercio y monto dentro de rango.

#### processPayment(cardId, merchant, amount)
Contrato:
- Entrada: cardId, merchant, amount.
- Salida: Promise<string> id transaccion.

Proceso:
1. Verifica uid autenticado.
2. Inserta documento en transactions con timestamp ISO.
3. Ejecuta Haptics.impact(ImpactStyle.Medium).

Errores:
- Lanza error si no hay sesion activa.

#### getTransactions(cardId?, day?)
Retorno:
- Observable<WalletTransaction[]>.

Pipeline:
1. Carga por uid.
2. Filtra opcional por cardId.
3. Filtra opcional por dia (toLocalDateKey).
4. Ordena descendente por date.

#### toLocalDateKey(value)
Retorno:
- string YYYY-MM-DD en zona local del dispositivo.

Objetivo:
- Evitar desfases de filtro por timezone.

#### updateReaction(transactionId, emoji)
Contrato:
- Entrada: id transaccion + emoji unicode.
- Salida: Promise<void>.

---

## 11) toast.service.ts

### ToastService
Responsabilidad: wrapper de toast nativo.

#### show(text, duration = 'short')
Contrato:
- Entrada: texto y duracion ('short' | 'long').
- Salida: Promise<void>.

---

## 12) user.service.ts

### UserService
Dominio: lectura y actualizacion de perfil de usuario.

#### getCurrentUserProfile()
Retorno:
- Observable<AppUser | undefined>.

#### updateBiometricPreference(enabled)
Contrato:
- Entrada: boolean.
- Salida: Promise<void>.

#### updateProfile(data)
Contrato:
- Entrada: campos permitidos (firstName, lastName, quickBiometricEnabled).
- Salida: Promise<void>.

Validaciones:
- Requiere uid autenticado para escribir en users/{uid}.

---

## Notas de integracion nativa

### Splash Screen (@capacitor/splash-screen)
- Configurado en capacitor.config.ts y recursos Android para arranque inicial profesional.
- El ocultado manual inmediato fue removido de app.component.ts para respetar el ciclo nativo.

### Haptics (@capacitor/haptics)
- Activo en payment.service (pago persistido).
- Tambien en capas de pagina para confirmaciones UX: login, registro, tarjetas, perfil y emoji reaction.
