import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CardComponent } from './components/card/card.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { TransactionItemComponent } from './components/transaction-item/transaction-item.component';
import { BalanceDisplayComponent } from './components/balance-display/balance-display.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { CustomInputComponent } from './components/custom-input/custom-input.component';
import { PaymentSimulatorComponent } from './components/payment-simulator/payment-simulator.component';
import { SkeletonLoadingComponent } from './components/skeleton-loading/skeleton-loading.component';
import { CalendarComponent } from './components/calendar/calendar.component';

@NgModule({
  declarations: [
    CardComponent,
    TransactionListComponent,
    TransactionItemComponent,
    BalanceDisplayComponent,
    QuickActionsComponent,
    CustomInputComponent,
    PaymentSimulatorComponent,
    SkeletonLoadingComponent,
    CalendarComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CardComponent,
    TransactionListComponent,
    TransactionItemComponent,
    BalanceDisplayComponent,
    QuickActionsComponent,
    CustomInputComponent,
    PaymentSimulatorComponent,
    SkeletonLoadingComponent,
    CalendarComponent,
  ],
})
export class SharedModule {}
