/*
 * Licensed to Laurent Broudoux (the "Author") under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. Author licenses this
 * file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { User } from '../models/user.model';
import { IAuthenticationService } from './auth.service';
import { KeycloakAuthenticationService } from './auth-keycloak.service';


@Injectable({ providedIn: 'root' })
export class UsersService {

  private rootUrl: string = '/api';
  
  private microcksAppClientId: string;

  constructor(private http: HttpClient, protected authService: IAuthenticationService) {
    if (authService instanceof KeycloakAuthenticationService) {
      this.rootUrl = (authService as KeycloakAuthenticationService).getAdminRealmUrl();
      this.loadClientId();
    }
  }

  private loadClientId(): void {
    this.http.get<any[]>(this.rootUrl + '/clients?clientId=microcks-app&max=2&search=true').subscribe(
      {
        next: res => {
          for (let i = 0; i < res.length; i++) {
            const client = res[i];
            if (client['clientId'] === 'microcks-app') {
              this.microcksAppClientId = client['id'];
              break;
            }
          }
        },
        error: err => {
          console.warn("Unable to retrieve microcksAppClientId from Keycloak. Maybe you do not have correct roles?");
          this.microcksAppClientId = null;
        },
      }
    );
  }

  getUsers(page: number = 1, pageSize: number = 20): Observable<User[]> {
    var first = 0;
    if (page > 1) {
      first += pageSize * (page - 1)
    }
    const options = { params: new HttpParams().set('first', String(first)).set('max', String(pageSize)) };
    return this.http.get<User[]>(this.rootUrl + '/users', options);
  }

  getMicrocksAppClientId(): string {
    return this.microcksAppClientId;
  }
  
  filterUsers(filter: string): Observable<User[]> {
    const options = { params: new HttpParams().set('search', filter) };
    return this.http.get<User[]>(this.rootUrl + '/users', options);
  }

  countUsers(): Observable<any> { 
    return this.http.get<User[]>(this.rootUrl + '/users/count');
  }

  getUserRoles(userId: string): Observable<any[]> {
    return this.http.get<any[]>(this.rootUrl + '/users/' + userId + '/role-mappings/clients/' + this.microcksAppClientId);
  }

  assignRoleToUser(userId: string, role: string): Observable<any> { 
    return this.getRoleByName(role).pipe(
      switchMap((role: any) => {
        return this.http.post<any[]>(this.rootUrl + '/users/' + userId + '/role-mappings/clients/' + this.microcksAppClientId, [ role ]); 
      })
    );
  }

  removeRoleFromUser(userId: string, role: string): Observable<any> {
    return this.getRoleByName(role).pipe(
      switchMap((role: any) => {
        return this.http.request<any[]>('delete', 
          this.rootUrl + '/users/' + userId + '/role-mappings/clients/' + this.microcksAppClientId, { body: [ role ] });
      })
    );
  }

  private getRoleByName(role: string): Observable<any> {
    return this.http.get<any[]>(this.rootUrl + '/clients/' + this.microcksAppClientId + '/roles/' + role);
  }
}