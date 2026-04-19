import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { BiometricService } from '../services/biometric.service';

@Injectable({ providedIn: 'root' })
export class BiometricLockGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly biometricService: BiometricService,
    private readonly router: Router,
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.userService.getCurrentUserProfile().pipe(
      take(1),
      switchMap((user) => {
        if (!user?.quickBiometricEnabled) {
          return of(true);
        }
        return from(this.biometricService.verifyIdentity('Verifica tu identidad para continuar')).pipe(
          map((ok) => (ok ? true : this.router.createUrlTree(['/home']))),
          catchError(() => of(this.router.createUrlTree(['/home']))),
        );
      }),
    );
  }
}
