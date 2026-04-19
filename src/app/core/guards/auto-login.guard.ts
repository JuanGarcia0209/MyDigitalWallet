import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.authService.isLoggedIn$.pipe(
      take(1),
      map((isLogged) => {
        if (!isLogged) {
          return true;
        }

        if (route.routeConfig?.path === 'register' && route.queryParamMap.get('mode') === 'google-complete') {
          return true;
        }

        return this.router.createUrlTree(['/home']);
      }),
    );
  }
}
