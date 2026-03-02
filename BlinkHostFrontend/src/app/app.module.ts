import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChartModule } from 'angular-highcharts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { FirstPageComponent } from './pages/oneTimeOnly/first-page/first-page.component';
import { NavBarComponent } from './compos/nav-bar/nav-bar.component';
import { SoonPageComponent } from './pages/soon-page/soon-page.component';
import { ManageAppComponent } from './pages/manage-app/manage-app.component';
import { BackToHomeComponent } from './compos/back-to-home/back-to-home.component';
import { LoadingComponent } from './compos/loading/loading.component';
import { AddNewProjectComponent } from './compos/add-new-project/add-new-project.component';
import { ShowMsgComponent } from './compos/show-msg/show-msg.component';
import { YesNoQuestionComponent } from './compos/yes-no-question/yes-no-question.component';
import { EditAProjectComponent } from './compos/edit-a-project/edit-a-project.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { FormsModule } from '@angular/forms';
import { CreditsComponent } from './pages/credits/credits.component';

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    FirstPageComponent,
    NavBarComponent,
    SoonPageComponent,
    ManageAppComponent,
    BackToHomeComponent,
    LoadingComponent,
    AddNewProjectComponent,
    ShowMsgComponent,
    YesNoQuestionComponent,
    EditAProjectComponent,
    DashboardComponent,
    SettingsPageComponent,
    CreditsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ChartModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
