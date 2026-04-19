import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
import { HttpService } from './http.service';

interface LoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private pushToken = '';

  constructor(private readonly httpService: HttpService) {}

  async initPush(): Promise<void> {
    await PushNotifications.requestPermissions();
    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      this.pushToken = token.value;
    });
  }

  async sendPaymentNotification(amount: number): Promise<void> {
    const email = environment.notificationService.email;
    const password = environment.notificationService.password;

    if (!this.pushToken || !email || !password) {
      return;
    }

    const loginBody = {
      email,
      password,
    };

    const login = await firstValueFrom(
      this.httpService.post<LoginResponse>(`${environment.notificationService.baseUrl}/user/login`, loginBody),
    );

    const body = {
      token: this.pushToken,
      notification: {
        title: 'Pago Exitoso',
        body: `Has realizado un pago de $${amount.toLocaleString('es-CO')}`,
      },
      android: {
        priority: 'high',
        data: { key: 'payment-success' },
      },
    };

    await firstValueFrom(
      this.httpService.post(`${environment.notificationService.baseUrl}/notifications/`, body, login.token),
    );
  }
}
