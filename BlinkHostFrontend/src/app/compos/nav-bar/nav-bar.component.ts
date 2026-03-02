import { animate, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';
import { BasicService } from 'src/app/BasicService/basic.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'],
  animations: [
    trigger(
      'enterAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('200ms', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('200ms', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ]
    )
  ],
})
export class NavBarComponent {
  constructor(private bService: BasicService) { }

  toggleMinMaxWin() { this.bService.sendReceiveData('toggle-max-min', 'OK') }

  minimizeWindow() { this.bService.sendReceiveData('win-minimize', 'OK') }

  showCloseQuestion: boolean = false;

  closeWindow() { this.bService.sendReceiveData('win-close', 'OK') }

  openDeveloperUrl() {
    this.bService.openAUrl('https://thefardeenkhan.netlify.app/');
    this.bService.setShowMsg('Developer portfolio is opening');
  }
  runInBackground() { this.bService.sendReceiveData('run-app-in-background', 'OK') }

}
