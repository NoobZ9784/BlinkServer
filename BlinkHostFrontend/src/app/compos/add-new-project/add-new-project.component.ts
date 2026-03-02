import { animate, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { BasicService } from 'src/app/BasicService/basic.service';
import { Project } from 'src/app/models/Project';

@Component({
  selector: 'app-add-new-project',
  templateUrl: './add-new-project.component.html',
  styleUrls: ['./add-new-project.component.css'],
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

export class AddNewProjectComponent {
  constructor(private bService: BasicService, private zone: NgZone) { }
  @Input() showNewProjectCard: boolean = false;
  @Output() addNewProject: EventEmitter<any> = new EventEmitter();


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
  cancel() { this.addNewProject.emit({ status: false, data: null }) }

  saveProject(name: HTMLInputElement, ip1: HTMLInputElement, ip2: HTMLInputElement, ip3: HTMLInputElement, ip4: HTMLInputElement, port: HTMLInputElement, dynamicRouting: HTMLSelectElement) {
    let portNum = parseInt(port.value);
    let today = new Date();
    let localhost: boolean = false;

    if (name.value === '') { this.showNameValidationMsg = true }
    else if (ip1.value.length > 3 && ip1.value.length > 0) { this.showIpValidationMsg = true }
    else if (ip2.value.length > 3 && ip2.value.length > 0) { this.showIpValidationMsg = true }
    else if (ip3.value.length > 3 && ip3.value.length > 0) { this.showIpValidationMsg = true }
    else if (ip4.value.length > 3 && ip4.value.length > 0) { this.showIpValidationMsg = true }
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
          id: Date.now(),
          name: name.value,
          ip: (localhost) ? 'localhost' : `${ip1.value}.${ip2.value}.${ip3.value}.${ip4.value}`,
          port: portNum,
          is_Active: false,
          created_on: `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()} ${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`,
          dynamic_routing: (dynamicRouting.value === 'y') ? true : false,
          httpSecured: false
        }
        this.bService.sendReceiveData('add-new-project', newProject).then(
          (data: any) => {
            if (data.status) { this.addNewProject.emit({ status: true }) }
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