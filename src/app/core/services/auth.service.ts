import { Injectable } from '@angular/core';
import {
  Auth,
  AuthError,
  GoogleAuthProvider,
  User,
  authState,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { Capacitor } from '@capacitor/core';
import { Observable, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { AppUser } from '../models/app.models';
import { FirestoreService } from './firestore.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user$: Observable<User | null> = authState(this.auth);
  readonly isLoggedIn$: Observable<boolean> = this.user$.pipe(map((user) => !!user));

  constructor(
    private readonly auth: Auth,
    private readonly firestoreService: FirestoreService,
    private readonly router: Router,
  ) {}

  async registerWithEmail(data: Omit<AppUser, 'uid'> & { password: string }): Promise<void> {
    const credential = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
    const user = credential.user;

    await this.firestoreService.set<AppUser>('users', user.uid, {
      uid: user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      country: data.country,
      email: data.email,
      quickBiometricEnabled: false,
      createdAt: new Date().toISOString(),
    });
  }

  loginWithEmail(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password).then(() => undefined);
  }

  async loginWithGoogle(): Promise<{ needsProfileCompletion: boolean; profile: { uid: string; firstName: string; lastName: string; email: string } }> {
    const clientId = (environment as { googleSignIn?: { webClientId?: string } }).googleSignIn?.webClientId?.trim() || '';
    let authResult;
    let firstName = 'Usuario';
    let lastName = 'Google';
    let email = '';
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      if (clientId) {
        await GoogleSignIn.initialize({
          clientId,
          scopes: ['profile', 'email'],
        });
      }

      const result = await GoogleSignIn.signIn();
      const idToken = (result as { idToken?: string; authentication?: { idToken?: string } }).idToken
        || (result as { authentication?: { idToken?: string } }).authentication?.idToken
        || '';
      const accessToken = (result as { accessToken?: string; authentication?: { accessToken?: string } }).accessToken
        || (result as { authentication?: { accessToken?: string } }).authentication?.accessToken
        || '';

      if (!result.email || (!idToken && !accessToken)) {
        throw new Error('No fue posible obtener informacion de Google Sign-In');
      }

      const credential = GoogleAuthProvider.credential(idToken || null, accessToken || null);
      authResult = await signInWithCredential(this.auth, credential);
      email = result.email;
      firstName = result.givenName || result.displayName?.split(' ')[0] || 'Usuario';
      lastName = result.familyName || result.displayName?.replace(firstName, '').trim() || 'Google';
    } else {
      const provider = new GoogleAuthProvider();
      authResult = await signInWithPopup(this.auth, provider);
      email = authResult.user.email || '';
      firstName = authResult.user.displayName?.split(' ')[0] || 'Usuario';
      lastName = authResult.user.displayName?.replace(firstName, '').trim() || 'Google';
    }

    const uid = authResult.user.uid;

    const existingProfile = await firstValueFrom(this.firestoreService.getDoc<AppUser>('users', uid).pipe(take(1)));
    if (!existingProfile) {
      return {
        needsProfileCompletion: true,
        profile: { uid, firstName, lastName, email },
      };
    }

    return {
      needsProfileCompletion: false,
      profile: {
        uid,
        firstName: existingProfile.firstName,
        lastName: existingProfile.lastName,
        email: existingProfile.email,
      },
    };
  }

  async completeGoogleProfile(data: Omit<AppUser, 'uid' | 'email' | 'createdAt' | 'quickBiometricEnabled'> & { email?: string }): Promise<void> {
    const uid = this.getCurrentUid();
    if (!uid) {
      throw new Error('No hay sesion activa');
    }

    const email = data.email || this.getCurrentEmail() || '';
    if (!email) {
      throw new Error('No fue posible obtener el correo de Google');
    }

    await this.firestoreService.set<AppUser>('users', uid, {
      uid,
      firstName: data.firstName,
      lastName: data.lastName,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      country: data.country,
      email,
      quickBiometricEnabled: false,
      createdAt: new Date().toISOString(),
    });
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  getCurrentUid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  getCurrentEmail(): string | null {
    return this.auth.currentUser?.email ?? null;
  }

  isAuthenticatedWithGoogle(): boolean {
    const providers = this.auth.currentUser?.providerData ?? [];
    return providers.some((provider) => provider.providerId === 'google.com');
  }

  getAuthErrorMessage(error: unknown): string {
    const code = (error as Partial<AuthError>)?.code ?? '';

    switch (code) {
      case 'auth/configuration-not-found':
        return 'No se encontro configuracion de autenticacion. Activa Email/Password en Firebase Console.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Credenciales invalidas.';
      case 'auth/email-already-in-use':
        return 'Este correo ya esta registrado.';
      case 'auth/invalid-email':
        return 'El correo no tiene un formato valido.';
      case 'auth/weak-password':
        return 'La contrasena debe tener al menos 6 caracteres.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Inicio de sesion cancelado.';
      case 'auth/operation-not-supported-in-this-environment':
        return 'Google Sign-In no esta disponible en este entorno.';
      case 'auth/popup-blocked':
        return 'El navegador bloqueo la ventana emergente de Google.';
      default:
        if (error instanceof Error && error.message.includes('googleSignIn.webClientId')) {
          return 'Falta configurar el Web Client ID de Google Sign-In.';
        }
        if (error instanceof Error && error.message.includes('Google Sign-In')) {
          return 'No se pudo iniciar sesion con Google. Verifica SHA-1/SHA-256 y configuracion de Firebase para Android.';
        }
        return 'Ocurrio un error de autenticacion. Intenta nuevamente.';
    }
  }
}
