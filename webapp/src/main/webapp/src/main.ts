import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
//import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import Keycloak, { KeycloakInitOptions } from './lib/keycloak';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Load Keycloak config from server. Need to do this before invoking
// keycloak-js constructor to first check the enabled flag.
let keycloakConfig: any;
console.log('[Microcks launch] Origin: ' + location.origin);

function getKeycloakConfig(callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', location.origin + '/api/keycloak/config', true);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200 || fileLoaded(xhr)) {
        keycloakConfig = JSON.parse(xhr.responseText);
        callback(null);
      } else {
        callback(xhr.response);
      }
    }
  };
  xhr.send();
}

// Actually call the getKeycloakConfig function and process with startup.
getKeycloakConfig(function(err, datums) {
  // Deal with error if any.
  if (err) {
    console.error('[Microcks launch] Error while fetching Keycloak config: ' + err);
    throw err;
  }

  if (keycloakConfig && keycloakConfig.enabled) {
    console.log('[Microcks launch] Keycloak is enabled, launching OIDC login flow...');

    // Build keycloak-js adapter from config.
    //const keycloak = (window as any).Keycloak({
    const keycloak = new Keycloak({
      url: keycloakConfig['auth-server-url'],
      realm: keycloakConfig.realm,
      clientId: keycloakConfig.resource
    });
    //const loginOptions = {onLoad: 'login-required', checkLoginIframe: undefined};
    const loginOptions: KeycloakInitOptions = {onLoad: 'login-required', checkLoginIframe: true};

    if (location.origin.indexOf('/localhost:') != -1) {
      console.log('[Microcks launch] Running locally so disabling Keycloak checkLogin Iframe to respect modern browser restrictions');
      loginOptions.checkLoginIframe = false;
    }

    keycloak.init(loginOptions).then(function(authenticated) {
      if (authenticated) {
          (window as any).keycloak = keycloak;
          platformBrowserDynamic().bootstrapModule(AppModule)
              .catch(err => console.log(err));
      }
    }).catch(function() {
      console.error('[Microcks launch] Error while initializing Keycloak');
      alert('Failed to initialize authentication subsystem.');
    });
  } else {
    console.log('[Microcks launch] Keycloak is disabled so running in dev mode with anonymous authent');
    platformBrowserDynamic().bootstrapModule(AppModule)
        .catch(err => console.log(err));
  }
});

function fileLoaded(xhr) {
  return xhr.status == 0 && xhr.responseText && xhr.responseURL.startsWith('file:');
}
