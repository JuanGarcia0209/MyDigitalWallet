# Shared Components

Referencia tecnica de componentes compartidos en src/app/shared/components/.

## 1) balance-display.component.ts

### BalanceDisplayComponent
Objetivo: renderizar saldo con modo oculto/revelado.

#### toggle()
Firma:
- toggle(): void

Efecto:
- Alterna bandera hidden para cambiar representacion visual del saldo.

---

## 2) calendar.component.ts

### CalendarComponent
Objetivo: emitir filtro de fecha compatible con el servicio de transacciones.

#### onDateSelect(value)
Firma:
- onDateSelect(value: string | null): void

Proceso:
1. Si value vacio -> emite null.
2. Si value existe -> normaliza a YYYY-MM-DD.
3. Emite dateChange(normalized).

#### clear()
Firma:
- clear(): void

Efecto:
- Limpia input interno y emite null.

---

## 3) card.component.ts

### CardComponent
Objetivo: pintar tarjeta con estilo por marca y acciones opcionales.

Inputs/Outputs relevantes:
- card (obligatorio), showActions (opcional), editCard/deleteCard events.

#### ngAfterViewInit()
Firma:
- ngAfterViewInit(): void

Efecto:
- Marca componente como listo y ejecuta animateCard inicial.

#### ngOnChanges(changes)
Firma:
- ngOnChanges(changes: SimpleChanges): void

Regla:
- Si cambia card y la vista ya esta inicializada, reanima para transicion suave.

#### animateCard()
Firma:
- animateCard(): void

Proceso:
1. Lazy import de animejs.
2. Animacion de entrada (opacidad/transform).

#### brandLabel
Firma:
- get brandLabel(): string

Retorno:
- Etiqueta legible segun card.brand.

---

## 4) custom-input.component.ts

### CustomInputComponent
Objetivo: estandarizar campos con label, errores y estilo comun.

#### hasError
Firma:
- get hasError(): boolean

Regla:
- true cuando control invalido y (touched o dirty).

---

## 5) payment-simulator.component.ts

### PaymentSimulatorComponent
Objetivo: encapsular UI del simulador (tarjeta, comercio, monto, acciones).

Contrato de comunicacion:
- Inputs: card, merchant, amount.
- Outputs: regenerate, confirmPayment.

Nota:
- No contiene logica de negocio; la orquestacion vive en payment.page.ts.

---

## 6) quick-actions.component.ts

### QuickActionsComponent
Objetivo: exponer acciones rapidas de home.

Contrato de eventos:
- cambiarTarjeta
- realizarPago
- agregarTarjeta

Nota:
- Sin estado complejo; solo emision de eventos.

---

## 7) skeleton-loading.component.ts

### SkeletonLoadingComponent
Objetivo: renderizar placeholders durante carga.

#### skeletonRows
Firma:
- get skeletonRows(): number[]

Retorno:
- Arreglo [0..rows-1] para iterar en template.

---

## 8) transaction-item.component.ts

### TransactionItemComponent
Objetivo: item de transaccion con gestos long-press y acceso rapido a reacciones.

#### onPressStart()
Firma:
- onPressStart(): void

Proceso:
- Inicia timer de 2000ms; al completar, emite longPress(transaction).

#### onPressEnd()
Firma:
- onPressEnd(): void

Efecto:
- Cancela timer pendiente para evitar long press accidental.

#### onReactionTap(event)
Firma:
- onReactionTap(event: Event): void

Proceso:
1. stopPropagation + preventDefault.
2. Cancela timer long press.
3. Emite longPress(transaction) para abrir picker.

Aclaracion de responsabilidades:
- Este componente solo dispara apertura de picker.
- Persistencia de emoji, loading y haptics se maneja en payment.page.ts.

---

## 9) transaction-list.component.ts

### TransactionListComponent
Objetivo: agrupar transacciones por dia y delegar render de cada item.

#### groupedTransactions
Firma:
- get groupedTransactions(): Array<{ date: string; items: WalletTransaction[] }>

Proceso:
1. Agrupa por clave de fecha (YYYY-MM-DD).
2. Ordena fechas desc.
3. Entrega estructura lista para template.
