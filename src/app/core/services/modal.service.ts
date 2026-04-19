import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ModalService {
  constructor(private readonly modalCtrl: ModalController) {}

  async open(component: unknown, componentProps?: Record<string, unknown>): Promise<HTMLIonModalElement> {
    const modal = await this.modalCtrl.create({
      component: component as never,
      componentProps,
      breakpoints: [0, 0.6, 0.95],
      initialBreakpoint: 0.6,
    });
    await modal.present();
    return modal;
  }

  async close(data?: unknown): Promise<void> {
    await this.modalCtrl.dismiss(data);
  }
}
