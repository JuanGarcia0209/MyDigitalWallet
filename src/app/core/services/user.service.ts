import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUser } from '../models/app.models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(
    private readonly authService: AuthService,
    private readonly firestoreService: FirestoreService,
  ) {}

  getCurrentUserProfile(): Observable<AppUser | undefined> {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      return new Observable<AppUser | undefined>((subscriber) => {
        subscriber.next(undefined);
        subscriber.complete();
      });
    }
    return this.firestoreService.getDoc<AppUser>('users', uid);
  }

  updateBiometricPreference(enabled: boolean): Promise<void> {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      return Promise.reject(new Error('No hay sesion activa'));
    }
    return this.firestoreService.update<AppUser>('users', uid, {
      quickBiometricEnabled: enabled,
    });
  }

  updateProfile(data: Pick<AppUser, 'firstName' | 'lastName' | 'quickBiometricEnabled'>): Promise<void> {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      return Promise.reject(new Error('No hay sesion activa'));
    }

    return this.firestoreService.update<AppUser>('users', uid, {
      firstName: data.firstName,
      lastName: data.lastName,
      quickBiometricEnabled: data.quickBiometricEnabled,
    });
  }
}
