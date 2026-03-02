import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BasicService } from 'src/app/BasicService/basic.service';
import { AppData } from 'src/app/models/AppData';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
  constructor(private bService: BasicService) { this.settingsSubscription = bService.getSettingsObserver().subscribe((data: any) => { this.changeAppearance(data) }) }


  settingsSubscription: Subscription

  ngOnInit(): void { this.changeAppearance(this.bService.getBlinkSettings()); }

  ngOnDestroy(): void { this.settingsSubscription.unsubscribe(); }

  changeAppearance(data: any) {
    let mainEl = (document.getElementById('home') as HTMLElement);
    try {
      if (data.theme === 'D') {
        mainEl.classList.remove('homel');
        mainEl.classList.add('homed');
      } else {
        mainEl.classList.remove('homed');
        mainEl.classList.add('homel');
      }
    } catch (err) { }
  }


  test() {
    let data: AppData = {
      channel: 'test',
      data: 'This Data is from frontend'
    }
    this.bService.sendReceiveData('test', 'This Data is from frontend').then(
      (data: any) => console.log,
      (err) => console.error
    );
  }

  showSoon() { this.bService.setSoonPage(true) }
  gotoPage(path: string) { this.bService.goto(path) }

}
