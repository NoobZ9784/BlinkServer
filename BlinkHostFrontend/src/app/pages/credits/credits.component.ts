import { Component } from '@angular/core';
import { BasicService } from 'src/app/BasicService/basic.service';

@Component({
  selector: 'app-credits',
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.css']
})
export class CreditsComponent {
  constructor(private bService: BasicService) { }

  credits: any = [
    { title: 'Software Developer & maintainer', url: 'https://thefardeenkhan.netlify.app/' },
    { title: 'Logo is designed by Stock6design / Freepik ', url: 'http://www.freepik.com/' },
    { title: 'Light background is designed by ArtDio2020 / Pixabay', url: 'https://pixabay.com/' },
    { title: 'Dark background is designed by Pressmaster / Pexels ', url: 'https://www.pexels.com/' },
    { title: 'Icons by Font Awsome', url: 'https://fontawesome.com/' },
    { title: 'Dashboard CPU & RAM chart by angular-highcharts', url: 'https://www.npmjs.com/package/angular-highcharts/' },
    { title: 'Fonts by Google fonts (Open sans)', url: 'https://fonts.google.com/' },
  ];

  openUrl(url: string) { this.bService.openAUrl(url); }

}
