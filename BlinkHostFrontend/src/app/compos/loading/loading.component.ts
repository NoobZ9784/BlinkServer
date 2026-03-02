import { Component, OnInit } from '@angular/core';
import { BasicService } from 'src/app/BasicService/basic.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit {

  constructor(private bService: BasicService) { }

  ngOnInit(): void { this.bService.getLoadingObserver().subscribe((data: boolean) => { this.showLoading = data }) }

  showLoading: boolean = false;
}
