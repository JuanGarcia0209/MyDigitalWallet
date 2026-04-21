import { Injectable } from '@angular/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

@Injectable({ providedIn: 'root' })
export class BiometricService {
  private readonly server = 'my-digital-wallet';

  async isAvailable(): Promise<boolean> {
    try {
      const result = await NativeBiometric.isAvailable();
      return !!result.isAvailable;
    } catch {
      return false;
    }
  }

  async verifyIdentity(reason = 'Confirma tu identidad'): Promise<boolean> {
    try {
      await NativeBiometric.verifyIdentity({
        reason,
        description: 'Autoriza la operacion con biometria o PIN del dispositivo',
      });
      return true;
    } catch {
      return false;
    }
  }

  async storeCredentials(username: string, password: string): Promise<void> {
    await NativeBiometric.setCredentials({
      server: this.server,
      username,
      password,
    });
  }

  async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const result = await NativeBiometric.getCredentials({ server: this.server });
      return { username: result.username, password: result.password };
    } catch {
      return null;
    }
  }

  async clearCredentials(): Promise<void> {
    try {
      await NativeBiometric.deleteCredentials({ server: this.server });
    } catch {
      // No-op
    }
  }
}
