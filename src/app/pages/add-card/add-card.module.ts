import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AddCardPageRoutingModule } from './add-card-routing.module';
import { AddCardPage } from './add-card.page';

@NgModule({
  imports: [SharedModule, AddCardPageRoutingModule],
  declarations: [AddCardPage],
})
export class AddCardPageModule {}
