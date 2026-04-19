import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loading?: HTMLIonLoadingElement;

  constructor(private readonly loadingCtrl: LoadingController) {}

  async show(message = 'Cargando...'): Promise<void> {
    if (this.loading) {
      return;
    }
    this.loading = await this.loadingCtrl.create({ message, spinner: 'crescent' });
    await this.loading.present();
  }

  async hide(): Promise<void> {
    if (!this.loading) {
      return;
    }
    await this.loading.dismiss();
    this.loading = undefined;
  }
}
