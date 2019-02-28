import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {App, Role, UserBasicInfo} from "./role";
import {Entity} from "jor-angular";
import {Router} from "@angular/router";
import {environment} from "../environments/environment";

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({providedIn: 'root'})
export class IdentityService {
  private originalHost = environment.originalHost;

  constructor(private http: HttpClient,
              private router: Router) {
  }

  /**
   * Logout the system
   */
  logout(): Observable<any> {
    return this.http.delete(this.originalHost + '/api/logout', httpOptions).pipe(
      catchError(this.handleError<any>('Logout')));
  }

  getLogonUser(): Observable<UserBasicInfo> {
    return this.http.get<UserBasicInfo>(this.originalHost + '/api/session', httpOptions).pipe(
      map( userSession => {
        const userInfo = new UserBasicInfo();
        userInfo.userID = userSession['identity']['userBasic']['USER_ID'];
        userInfo.userName = userSession['identity']['userBasic']['USER_NAME'];
        userInfo.displayName = userSession['identity']['userBasic']['DISPLAY_NAME'];
        return userInfo;
      }),
      catchError(this.handleError<any>('getRoleDetail')));
  }

  /**
   * Get a role detail information from backend based on an authenticated user
   * @returns {Observable<Role>}
   */
  getRoleDetail(): Observable<Role[]> {
    return this.http.post<Role[]>(this.originalHost + `/api/function/getRoleDetail`, {}, httpOptions).pipe(
      catchError(this.handleError<any>('getRoleDetail')));
  }

  /**
   * Get an APP detail based on a routeLink
   * @param {string} routeLink
   * @returns {Observable<App>}
   */
  getApp(routeLink: string): Observable<App> {
    if (routeLink.substr(0, 13) === '/external-app') {
      return this.http.post<Entity>(this.originalHost + `/api/entity/instance`,
        {RELATION_ID: 'app', APP_ID: routeLink.substr(14)}, httpOptions).pipe(
        map(appEntity => {
          const app: App = new App;
          if (Array.isArray(appEntity)) { appEntity = appEntity[0]; } // Could return an array, like message or multiple entities
          if (appEntity['ENTITY_ID']) { // It returns entity instance, rather than an error message;
            app.name = appEntity['app'][0]['NAME'];
            app.routeLink = routeLink;
          }
          return app;
        }),
        catchError(this.handleError<any>('getApp')));
    } else {
      return this.http.post<Entity>(this.originalHost + `/api/entity/instance`,
        {RELATION_ID: 'app', ROUTE_LINK: routeLink}, httpOptions).pipe(
        map(appEntity => {
          const app: App = new App;
          if (Array.isArray(appEntity)) { appEntity = appEntity[0]; }
          if (appEntity['ENTITY_ID']) {
            app.name = appEntity['app'][0]['NAME'];
            app.routeLink = appEntity['app'][0]['ROUTE_LINK'];
          }
          return app;
        }),
        catchError(this.handleError<any>('getApp')));
    }
  }

  /**
   * Get an APP's routelink from its appID
   * @param appID
   */
  getAppRouteLink(appID: string): Observable<string> {
    return this.http.post<string>(this.originalHost + `/api/entity/instance`,
      {RELATION_ID: 'app', APP_ID: appID}, httpOptions).pipe(
      map(appEntity => {
        if (Array.isArray(appEntity)) { appEntity = appEntity[0]; } // Could return an array, like message or multiple entities
        if (appEntity['ENTITY_ID']) { // It returns entity instance, rather than an error message;
          return appEntity['app'][0]['ROUTE_LINK'];
        } else {
          return 'appNotFound';
        }
      }),
      catchError(this.handleError<any>('getAppRouteLink')));
  }

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO add messages to message service
      this.router.navigate(['errors']);
      console.error(operation, error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
