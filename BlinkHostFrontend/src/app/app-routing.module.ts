import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { FirstPageComponent } from './pages/oneTimeOnly/first-page/first-page.component';
import { ManageAppComponent } from './pages/manage-app/manage-app.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { CreditsComponent } from './pages/credits/credits.component';

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'manage',
    component: ManageAppComponent
  },
  {
    path: 'settings',
    component: SettingsPageComponent
  },
  {
    path: 'credits',
    component: CreditsComponent
  },
  {
    path: 'ftFirst',
    component: FirstPageComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
