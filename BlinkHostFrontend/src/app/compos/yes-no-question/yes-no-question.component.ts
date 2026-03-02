import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BasicService } from 'src/app/BasicService/basic.service';

@Component({
  selector: 'app-yes-no-question',
  templateUrl: './yes-no-question.component.html',
  styleUrls: ['./yes-no-question.component.css']
})
export class YesNoQuestionComponent {

  constructor(private bService: BasicService) { }


  @Input() question: any = { title: '', que: '', data: {} };
  @Output() userAnswer: EventEmitter<any> = new EventEmitter();

  ngOnInit(): void { }

  userAnswerBtn(ans: boolean) { this.userAnswer.emit({ ans: ans, title: this.question.title }) }

}
