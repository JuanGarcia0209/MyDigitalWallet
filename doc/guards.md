# Guards

Referencia tecnica de guards en src/app/core/guards/.

## 1) auth.guard.ts

### AuthGuard
Responsabilidad: proteger rutas privadas cuando no existe sesion autenticada.

#### constructor(authService, router)
Dependencias:
- authService: entrega el estado de sesion por authService.isLoggedIn$.
- router: genera UrlTree de redireccion cuando no hay acceso.

#### canActivate()
Firma:
- canActivate(): Observable<boolean | UrlTree>

Retorno:
- true: permite activar la ruta.
- UrlTree('/login'): bloquea la ruta y redirige a login.

Flujo interno:
1. Toma un unico valor de isLoggedIn$ usando take(1).
2. Si el estado es autenticado, retorna true.
3. Si no, retorna router.createUrlTree(['/login']).

Efectos secundarios:
- No muta estado global.
- Delega la navegacion a Router via UrlTree.

Errores:
- No lanza errores explicitamente; cualquier error de stream queda manejado por Angular Router.

---

## 2) auto-login.guard.ts

### AutoLoginGuard
Responsabilidad: bloquear acceso a login/registro cuando el usuario ya esta autenticado, con excepcion para completar perfil Google.

#### constructor(authService, router)
Dependencias:
- authService: fuente de estado de autenticacion.
- router: salida de redireccion a home.

#### canActivate(route)
Firma:
- canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree>

Parametros:
- route: snapshot actual para leer path y query params.

Retorno:
- true: permite navegacion.
- UrlTree('/home'): redirige cuando no debe entrar a auth pages.

Reglas de decision:
1. Si no hay sesion activa, retorna true.
2. Si hay sesion activa y la ruta es register con mode=google-complete, retorna true.
3. En cualquier otro caso autenticado, retorna UrlTree('/home').

Efectos secundarios:
- No cambia estado del usuario.
- Solo decide acceso por enrutamiento.

Errores:
- No define manejo explicito; flujo depende del stream de autenticacion.

---

## 3) biometric-lock.guard.ts

### BiometricLockGuard
Responsabilidad: solicitar verificacion biometrica antes de activar una ruta para usuarios con quickBiometricEnabled.

#### constructor(userService, biometricService, router)
Dependencias:
- userService: obtiene perfil actual para leer quickBiometricEnabled.
- biometricService: dispara la autenticacion nativa.
- router: arma UrlTree de fallback a home.

#### canActivate()
Firma:
- canActivate(): Observable<boolean | UrlTree>

Retorno:
- true: permite acceso.
- UrlTree('/home'): bloquea acceso cuando la validacion falla.

Flujo interno:
1. Obtiene perfil con userService.getCurrentUserProfile().pipe(take(1)).
2. Si quickBiometricEnabled es false/undefined, retorna of(true).
3. Si quickBiometricEnabled es true, ejecuta biometricService.verifyIdentity('Verifica tu identidad para continuar').
4. Si verifyIdentity responde true, retorna true.
5. Si responde false o lanza error, retorna UrlTree('/home').

Efectos secundarios:
- Muestra prompt biometrico del sistema operativo.
- Puede desviar navegacion a home.

Errores y fallback:
- Cualquier error del plugin biometrico se captura con catchError y se transforma en UrlTree('/home').
