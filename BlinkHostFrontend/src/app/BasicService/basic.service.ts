import { Injectable, NgZone, OnInit } from '@angular/core';
import { AppData } from '../models/AppData';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BasicService {
  constructor(private router: Router, private zone: NgZone) {}


  isFirstUser(): boolean {
    let res = localStorage.getItem('isUserIsFirst')
    if (res !== null && JSON.parse(res).isVisitedUser) {
      return false;
    } else {
      let newUser = { isVisitedUser: true };
      this.goto('ftFirst')
      return true;
    }
  }

  sendReceiveData(path: string, data: any) {
    return new Promise((resolve, reject) => {
      this.setLoading(true);
      try {
        this.zone.run(() => {
          window['api'].send(path, data);
          window['api'].receive(path + '-result', (data: any) => {
            resolve(data);
          });
        });
      } catch (err) {
        reject({ status: false, error: err });
      }
      this.setLoading(false);
    });
  }

  goto(path: string) { this.router.navigate([path]) }

  openAUrl(url: string) { this.sendReceiveData('open-a-url', { url: url }) }

  private soonPageSubject = new Subject<boolean>;
  setSoonPage(data: boolean): void { this.soonPageSubject.next(data) }
  getSoonPageSubscription(): Observable<boolean> { return this.soonPageSubject.asObservable() }

  private loadingSubject = new Subject<boolean>;
  setLoading(data: boolean): void { this.loadingSubject.next(data) }
  getLoadingObserver(): Observable<boolean> { return this.loadingSubject.asObservable() }

  private showMsgSubject = new Subject<string>;
  setShowMsg(msg: string): void { this.showMsgSubject.next(msg) }
  getShowMsgObserver(): Observable<string> { return this.showMsgSubject.asObservable() }

  private blinkSettings: any = null;
  private saveSettingsSubject = new Subject<any>;
  setSettings(data: any): void { this.saveSettingsSubject.next(data); this.blinkSettings = data; }
  getSettingsObserver(): Observable<any> { return this.saveSettingsSubject.asObservable(); }
  getBlinkSettings(): any { return this.blinkSettings; }

  private serverTraffic: any = null;
  getServerTraffic(): any { return this.serverTraffic; }
  setServerTraffic(data: any) { this.serverTraffic = data };


// Example usage
}
