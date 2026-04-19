import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { PaymentPageRoutingModule } from './payment-routing.module';
import { PaymentPage } from './payment.page';

@NgModule({
  imports: [SharedModule, PickerModule, PaymentPageRoutingModule],
  declarations: [PaymentPage],
})
export class PaymentPageModule {}
