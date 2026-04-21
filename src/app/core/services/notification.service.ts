import { Injectable } from '@angular/core';
import { Dialog } from '@capacitor/dialog';
import { PushNotifications } from '@capacitor/push-notifications';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
import { HttpService } from './http.service';

interface LoginResponse {
  data?: {
    access_token?: string;
  };
  token?: string;
}

interface NotificationSendResult {
  success: boolean;
  errorMessage?: string;
  debugDetails?: string;
  pushToken?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private pushToken = '';
  private listenersAttached = false;

  constructor(private readonly httpService: HttpService) {}

  async initPush(): Promise<void> {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      return;
    }

    if (!this.listenersAttached) {
      PushNotifications.addListener('registration', (token) => {
        this.pushToken = token.value;
        console.log('Push token registrado', token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error registrando push notifications', error);
        void Dialog.alert({
          title: 'Error Push',
          message: this.formatErrorMessage(error),
        });
      });

      this.listenersAttached = true;
    }

    await PushNotifications.register();
  }

  async sendPaymentNotification(amount: number): Promise<NotificationSendResult> {
    const email = environment.notificationService.email;
    const password = environment.notificationService.password;

    if (!email || !password) {
      return {
        success: false,
        errorMessage: 'Faltan credenciales de notificacion en environment.',
        debugDetails: 'Faltan credenciales de notificacion en environment.',
        pushToken: this.pushToken,
      };
    }

    const tokenReady = await this.waitForPushToken();
    if (!tokenReady) {
      return {
        success: false,
        errorMessage: 'No se obtuvo token FCM del dispositivo a tiempo.',
        debugDetails: 'No se obtuvo token FCM del dispositivo a tiempo.',
        pushToken: this.pushToken,
      };
    }

    const loginBody = {
      email,
      password,
    };

    try {
      const login = await firstValueFrom(
        this.httpService.post<LoginResponse>(`${environment.notificationService.baseUrl}/user/login`, loginBody),
      );
      const authToken = login.token || login.data?.access_token;

      if (!authToken) {
        return {
          success: false,
          errorMessage: 'El API de login no devolvio access_token.',
          debugDetails: 'El API de login no devolvio access_token.',
          pushToken: this.pushToken,
        };
      }

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
        this.httpService.post(`${environment.notificationService.baseUrl}/notifications/`, body, authToken),
      );
      return { success: true, pushToken: this.pushToken };
    } catch (error) {
      console.error('Error enviando notificacion de pago', error);
      const message = this.formatErrorMessage(error);
      const debugDetails = this.serializeError(error);
      void Dialog.alert({
        title: 'Error de notificacion',
        message,
      });
      return { success: false, errorMessage: message, debugDetails, pushToken: this.pushToken };
    }
  }

  private async waitForPushToken(timeoutMs = 4000): Promise<boolean> {
    const start = Date.now();
    while (!this.pushToken && Date.now() - start < timeoutMs) {
      await new Promise<void>((resolve) => setTimeout(resolve, 200));
    }

    return !!this.pushToken;
  }

  private formatErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const asRecord = error as {
        status?: unknown;
        statusText?: unknown;
        message?: unknown;
        error?: unknown;
        extra?: unknown;
      };

      const nestedSources = [asRecord.error, asRecord.extra];
      for (const source of nestedSources) {
        if (source && typeof source === 'object') {
          const nested = source as {
            message?: unknown;
            msg?: unknown;
            extra?: unknown;
          };

          if (typeof nested.message === 'string' && nested.message.trim()) {
            return nested.message;
          }

          if (typeof nested.msg === 'string' && nested.msg.trim()) {
            return nested.msg;
          }

          if (nested.extra && typeof nested.extra === 'object') {
            const deeper = nested.extra as { message?: unknown; msg?: unknown };
            if (typeof deeper.message === 'string' && deeper.message.trim()) {
              return deeper.message;
            }
            if (typeof deeper.msg === 'string' && deeper.msg.trim()) {
              return deeper.msg;
            }
          }
        }
      }

      if (typeof asRecord.message === 'string' && asRecord.message.trim()) {
        return asRecord.message;
      }

      if (typeof asRecord.status === 'number') {
        const statusText = typeof asRecord.statusText === 'string' && asRecord.statusText.trim()
          ? asRecord.statusText
          : 'Error de red';
        return `HTTP ${asRecord.status}: ${statusText}`;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    if (error && typeof error === 'object') {
      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
        return maybeMessage;
      }
    }

    return 'No fue posible enviar la notificacion.';
  }

  private serializeError(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.stack || error.message;
    }

    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return this.formatErrorMessage(error);
    }
  }
}
