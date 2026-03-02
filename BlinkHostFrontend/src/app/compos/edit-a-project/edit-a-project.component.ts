import { animate, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BasicService } from 'src/app/BasicService/basic.service';
import { Project } from 'src/app/models/Project';

@Component({
  selector: 'app-edit-a-project',
  templateUrl: './edit-a-project.component.html',
  styleUrls: ['./edit-a-project.component.css'],
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
export class EditAProjectComponent {
  constructor(private bService: BasicService, private zone: NgZone) { }
  @Input() projectOldData: any = null;
  @Output() saveProjectDetails: EventEmitter<any> = new EventEmitter();

  getIpPart(part: number): string | number {
    if (this.projectOldData.ip == 'lcoalhost') {
      return '';
    } else {
      return this.projectOldData.ip.split('.')[part];
    }
  }

  newProjectData: Project = { id: 0, name: '', ip: '', port: 0, is_Active: false, created_on: '', dynamic_routing: false, httpSecured: false }
  showNameValidationMsg: boolean = false;
  showIpValidationMsg: boolean = false;
  showPortNumValidationMsg: boolean = false;

  ipLengthValidation(inp: HTMLInputElement) {
    if (inp.value.length > 3) {
      inp.value = inp.value.substring(0, inp.value.length - 1)
      this.showIpValidationMsg = true;
    } else { this.showIpValidationMsg = false; }
  }

  portNumValidation(inp: HTMLInputElement) {
    let num = parseInt(inp.value);
    if (num < 0 || num > 65536) {
      this.showPortNumValidationMsg = true;
    }
    else { this.showPortNumValidationMsg = false }
  }
  nameValidation(inp: HTMLInputElement) {
    if (inp.value === '') { this.showNameValidationMsg = true }
    else { this.showNameValidationMsg = false }
  }
  cancel() { this.saveProjectDetails.emit({ status: false, data: null }) }

  httpChange(httpEl: HTMLSelectElement, isUpdate: boolean = false) {
    if ((httpEl.value === 'Y' && !this.projectOldData.httpSecured) || isUpdate) {
      let sendData: any = this.projectOldData;
      if (isUpdate) { sendData.isUpdate = true; }
      this.bService.sendReceiveData('get-security-keys', sendData).then(
        (data: any) => {
          if (data.status) {
            httpEl.value = 'Y';
            this.bService.setShowMsg('Successfully added security files');
            this.projectOldData.httpSecured = true;
          }
          else {
            if (data.error === 'Security files already exists') { this.projectOldData.httpSecured = true; }
            else if (data.error === 'Canceled selection' && sendData.isUpdate) { this.bService.setShowMsg(data.error); }
            else { this.bService.setShowMsg(data.error); httpEl.value = 'N' }
          }
        },
        (err) => console.error
      )
    }
  }

  saveProject(name: HTMLInputElement, ip1: HTMLInputElement, ip2: HTMLInputElement, ip3: HTMLInputElement, ip4: HTMLInputElement, port: HTMLInputElement, dynamicRouting: HTMLSelectElement, httpConfig: HTMLSelectElement) {
    let portNum = parseInt(port.value);
    let today = new Date();
    let localhost: boolean = false;

    if (name.value === '') { this.showNameValidationMsg = true }
    else if (ip1.value.length > 3) { this.showIpValidationMsg = true }
    else if (ip2.value.length > 3) { this.showIpValidationMsg = true }
    else if (ip3.value.length > 3) { this.showIpValidationMsg = true }
    else if (ip4.value.length > 3) { this.showIpValidationMsg = true }
    else if (portNum < 0 || portNum > 65536) { this.showPortNumValidationMsg = true }
    else {
      if (ip1.value === '' && ip2.value === '' && ip3.value === '' && ip4.value === '') { localhost = true }
      if (
        (ip1.value.length === 0 && ip2.value.length === 0 && ip3.value.length === 0 && ip4.value.length === 0) ||
        ((ip2.value.length > 0 && ip2.value.length <= 4) && (ip2.value.length > 0 && ip2.value.length <= 4) && (ip3.value.length > 0 && ip3.value.length <= 4) && (ip4.value.length > 0 && ip4.value.length <= 4))
      ) {
        this.showNameValidationMsg = false;
        this.showIpValidationMsg = false;
        this.showPortNumValidationMsg = false;
        let newProject: Project = {
          id: this.projectOldData.id,
          name: this.projectOldData.name,
          ip: (localhost) ? 'localhost' : `${ip1.value}.${ip2.value}.${ip3.value}.${ip4.value}`,
          port: portNum,
          is_Active: false,
          created_on: this.projectOldData.created_on,
          dynamic_routing: (dynamicRouting.value === 'y') ? true : false,
          httpSecured: (httpConfig.value === 'Y') ? true : false
        }
        this.bService.sendReceiveData('save-a-edited-project', newProject).then(
          (data: any) => {
            if (data.status) { this.saveProjectDetails.emit({ status: true }) }
            else { this.bService.setShowMsg(data.error) }
          },
          (err) => console.error
        );
      } else {
        this.showIpValidationMsg = true;
      }
    }
  }

}
