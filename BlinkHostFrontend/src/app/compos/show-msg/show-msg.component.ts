import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { BasicService } from 'src/app/BasicService/basic.service';

@Component({
  selector: 'app-show-msg',
  templateUrl: './show-msg.component.html',
  styleUrls: ['./show-msg.component.css'],
  animations: [
    trigger(
      'enterAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('200ms', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate('200ms', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ]
    )
  ],
})
export class ShowMsgComponent implements OnInit {
  constructor(private bService: BasicService) { }

  ngOnInit(): void {
    this.bService.getShowMsgObserver().subscribe((msg: string) => {
      this.msg = msg;
      setTimeout(() => {
        this.msg = '';
      }, 4000)
    })
  }

  msg: string = '';
}
