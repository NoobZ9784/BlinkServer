import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BasicService } from 'src/app/BasicService/basic.service';

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css']
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  constructor(private bService: BasicService) { this.settingsSubscription = this.bService.getSettingsObserver().subscribe((data: any) => { this.changeAppearance(data) }); }

  settings: any = {
    theme: 'D',
    dashboardReloadTimeout: 5000,
    trafficReloadInterval: 10000,
  }
  settingsSubscription: Subscription

  ngOnInit(): void {
    let serviceSerttings = this.bService.getBlinkSettings();
    if (serviceSerttings !== null) {
      this.settings = serviceSerttings;
      this.changeAppearance(serviceSerttings);
    }
  }

  ngOnDestroy(): void { this.settingsSubscription.unsubscribe(); }

  changeAppearance(data: any) {
    let mainEl = (document.getElementById('settings') as HTMLElement);
    try {
      if (data.theme === 'D') {
        mainEl.classList.remove('settingsl');
        mainEl.classList.add('settingsd');
      } else {
        mainEl.classList.remove('settingsd');
        mainEl.classList.add('settingsl');
      }
    } catch (err) { }
  }

  saveSettings() {
    this.bService.sendReceiveData('save-blink-settings', this.settings).then(
      (data: any) => {
        if (data.status) {
          this.bService.setSettings(this.settings); this.changeAppearance(this.settings);
          this.bService.setShowMsg('Settings successfully saved');
        } else {
          this.bService.setShowMsg(data.error);
        }
      },
      (err) => console.error
    );
  }
}
