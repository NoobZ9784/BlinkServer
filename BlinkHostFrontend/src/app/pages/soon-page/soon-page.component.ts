import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { BasicService } from 'src/app/BasicService/basic.service';

@Component({
  selector: 'app-soon-page',
  templateUrl: './soon-page.component.html',
  styleUrls: ['./soon-page.component.css'],
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
export class SoonPageComponent implements OnInit {

  constructor(private bService: BasicService) { }
  ngOnInit(): void { this.bService.getSoonPageSubscription().subscribe((data: boolean) => { this.showMsg = data }) }

  showMsg: boolean = false;

}
