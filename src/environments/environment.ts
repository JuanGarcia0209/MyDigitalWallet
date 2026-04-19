// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyAR84z4gX3v8UMyPhwgt5zoA0HktT2Bv4Q",
    authDomain: "mydigitalwallet-5b214.firebaseapp.com",
    projectId: "mydigitalwallet-5b214",
    storageBucket: "mydigitalwallet-5b214.firebasestorage.app",
    messagingSenderId: "789768407785",
    appId: "1:789768407785:web:233ee38981072f6cdafe78"
  },
  googleSignIn: {
    webClientId: '789768407785-u36g97r1adrgqsng3dot33obre9uda8t.apps.googleusercontent.com',
  },
  notificationService: {
    baseUrl: 'https://sendnotificationfirebase-production.up.railway.app',
    email: '',
    password: '',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
