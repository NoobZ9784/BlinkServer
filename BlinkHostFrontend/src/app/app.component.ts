import { AfterViewInit, Component, NgZone, OnInit } from '@angular/core';
import { BasicService } from './BasicService/basic.service';
import { theme } from 'highcharts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'BlinkHostF';
  provider: boolean = true;
  themeModeDark: boolean = true
  constructor(private bService: BasicService, private zone: NgZone) {
    this.bService.getSettingsObserver().subscribe((data: any) => { this.changeApperance2(data) })
  }

  ngOnInit(): void { this.checkProvider(); }
  ngAfterViewInit(): void { }

  changeApperance(data: any) {
    this.zone.run(() => {
      console.log('in 1');
      try {
        // let backVideo = document.getElementById('backVideo') as 
        if (data.theme === 'D') { this.themeModeDark = true; }
        else { this.themeModeDark = false; }
      } catch (err) { console.error(err) }
    })
  }

  changeApperance2(data: any) {
    this.zone.run(() => {
      console.log('in 2');
      try {
        let backVideo = (document.getElementById('backVideo') as HTMLVideoElement)
        if (data.theme === 'D') { backVideo.src = 'assets/background.mp4'; }
        else { backVideo.src = 'assets/LightBack.mp4'; }
      } catch (err) { console.error(err) }
    })
  }
  checkProvider() {
    this.bService.sendReceiveData('check-provider-running-and-get-settings', 'OK').then(
      (data: any) => {
        if (data.status) { this.bService.setSettings(data.data); this.provider = true; this.changeApperance(data.data); }
        else { this.provider = false; this.bService.setShowMsg(data.err) }
      },
      (err) => console.error(err)
    );
  }
}
