import { Component } from '@angular/core';
import { BasicService } from 'src/app/BasicService/basic.service';

@Component({
  selector: 'app-back-to-home',
  templateUrl: './back-to-home.component.html',
  styleUrls: ['./back-to-home.component.css']
})
export class BackToHomeComponent {
  constructor(private bService: BasicService) { }

  goto(path: string) { this.bService.goto(path) }

}
