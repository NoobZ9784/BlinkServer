import { Component, NgZone, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BasicService } from 'src/app/BasicService/basic.service';

@Component({
  selector: 'app-manage-app',
  templateUrl: './manage-app.component.html',
  styleUrls: ['./manage-app.component.css']
})
export class ManageAppComponent implements OnInit {
  constructor(private bService: BasicService, private zone: NgZone) { this.settingsSubscription = bService.getSettingsObserver().subscribe((data: any) => { this.changeAppearance(data) }) }

  showAddNewProjectCard: boolean = false;
  editProjectData: any = null;
  totalNumberOfProjects: number = 0;
  stopedProjects: number = 0;
  runningProjcets: number = 0;
  appsList: any = {
    "testProject11712907269842": {
      "id": 1712907269842,
      "name": "testProject1",
      "ip": "localhost",
      "port": 3000,
      "is_Active": false,
      "created_on": "13:4:29 12-4-2024",
      "dynamic_routing": true,
      "httpSecured": false
    },
  };
  yesNoQuestion: any = {
    title: '',
    que: '',
    data: {},
  };


  settingsSubscription: Subscription

  ngOnInit(): void { this.loadServersList(); this.changeAppearance(this.bService.getBlinkSettings()); }

  ngOnDestroy(): void { this.settingsSubscription.unsubscribe(); }

  changeAppearance(data: any) {
    let mainEl = (document.getElementById('manage') as HTMLElement);
    try {
      if (data.theme === 'D') {
        mainEl.classList.remove('managel');
        mainEl.classList.add('managed');
      } else {
        mainEl.classList.remove('managed');
        mainEl.classList.add('managel');
      }
    } catch (err) { }
  }


  getKeysOfObject(obj: Object): string[] {
    return Object.keys(obj);
  }
  getValueOfObject(obj: Object): any {
    return Object.values(obj);
  }
  // openEditPopUp(row: any) { this.zone.run(() => {this.editProjectData = row; }) }

  loadData(data: any) {
    this.zone.run(() => {
      console.log(data);
      this.stopedProjects = 0;
      this.runningProjcets = 0;
      this.totalNumberOfProjects = this.getKeysOfObject(data).length;
      for (let prj of this.getValueOfObject(data.data)) {
        if (prj.is_Active) { this.runningProjcets++ }
        else { this.stopedProjects++ }
      }
      if (data.status) {
        this.appsList = data.data;
      } else { this.bService.setShowMsg(data.error) }
    });
  }

  loadServersList() {
    this.bService.sendReceiveData('get-all-servers-list', 'ok').then(
      (data) => {
        this.loadData(data);
      },
      (err) => { console.error(err); this.bService.setShowMsg('ERROR : ' + JSON.stringify(err)); }
    );
  }

  addNewProject(data: any) {
    this.showAddNewProjectCard = false;
    if (data.status) {
      this.loadServersList();
      this.bService.setShowMsg('New server successfully created.');
    }
  }

  startServer(project: any) {
    if (!project.is_Active) {
      this.bService.sendReceiveData('start-a-server', project).then(
        (data: any) => {
          if (data.status) {
            this.loadServersList();
            this.bService.setShowMsg('Server Successfully started.');
          }
          else { this.bService.setShowMsg(data.error) }
        },
        (err) => { console.error(err) }
      );
    }
  }
  stopServer(project: any) {
    if (project.is_Active) {
      this.bService.sendReceiveData('close-a-server', project).then(
        (data: any) => {
          if (data.status) {
            this.loadServersList();
            this.bService.setShowMsg('Server Successfully stoped.');
          }
          else { this.bService.setShowMsg(data.error) }
        },
        (err) => { console.error(err) }
      );
    }
  }
  restartServer(project: any) {
    if (project.is_Active) {

      this.bService.sendReceiveData('restart-a-server', project).then(
        (data: any) => {
          if (data.status) {
            this.loadServersList();
            this.bService.setShowMsg('Server Successfully restarted.');
          }
          else { this.bService.setShowMsg(data.error) }
        },
        (err) => console.error
      );
    }
  }
  yesNoQuestionAnswers(data: any) {
    if (data.title === 'close-all-servers' && data.ans) { this.stopAllRunningServers() }
    else if (data.title === 'start-all-servers' && data.ans) { this.startAllStopedServers() }
    else if (data.title === 'undeploye-a-project' && data.ans) { this.undeployeAPorject(this.yesNoQuestion.data) }
    this.yesNoQuestion = { title: '', que: '', data: {} };
  }
  stopAllRunningServers() {
    this.bService.sendReceiveData('stop-all-running-servers', 'OK').then(
      (data: any) => {
        if (data.status) { this.bService.setShowMsg('All servers are stoped.'); this.loadServersList(); }
        else { this.bService.setShowMsg(data.error) }
      },
      (err) => console.error
    );
  }

  openProjectUrl(project: any) {
    if (project.is_Active) {
      this.bService.setShowMsg(`${project.name} is opening`);
      this.bService.openAUrl(`${(project.httpSecured) ? 'https' : 'http'}://${project.ip}:${project.port}/`);
    }
  }

  startAllStopedServers() {
    this.bService.sendReceiveData('start-all-servers', 'OK').then(
      (data: any) => {
        if (data.status) {
          this.loadServersList();
          if (data.data.length > 0) {
            this.bService.setShowMsg('Some servers are started but some cannot because these ports are in use : ' + JSON.stringify(data.data));
          } else {
            this.bService.setShowMsg('All servers are started.');
          }
        }
        else { this.bService.setShowMsg(data.error) }
      },
      (err) => console.error
    );
  }

  saveEditedProjectData(data: any) {
    this.editProjectData = null;
    this.loadServersList();
    if (data.status) { this.bService.setShowMsg('Server details are updated successfully.'); }
  }

  undeployeAPorject(project: any) {
    if (!project.is_Active) {
      this.bService.sendReceiveData('undeploye-a-project', project).then(
        (data: any) => {
          if (data.status) { this.bService.setShowMsg('Project Successfully undeployed.'); this.loadServersList(); }
          else { this.bService.setShowMsg(data.error) }
        },
        (err) => console.error
      );
    }
  }

}
