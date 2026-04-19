import { Injectable } from '@angular/core';
import { Toast } from '@capacitor/toast';

@Injectable({ providedIn: 'root' })
export class ToastService {
  async show(text: string, duration: 'short' | 'long' = 'short'): Promise<void> {
    await Toast.show({ text, duration });
  }
}
