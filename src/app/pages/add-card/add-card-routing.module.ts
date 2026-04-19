import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddCardPage } from './add-card.page';

const routes: Routes = [{ path: '', component: AddCardPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddCardPageRoutingModule {}
