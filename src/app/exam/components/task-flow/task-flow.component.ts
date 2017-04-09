import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, Inject } from "@angular/core";
import { ExamService } from "../../data/exam-service.service";
import {
  IExamTaskFlowStepData,
  TaskFlowStepTypes,
  IVerifiedTaskFlowStepAnswer
} from "../../data/task-flow.api-protocol";
import { IExamTaskFlowTaskData } from "../../data/i-exam-task-flow-task-data";
import { InputSetData, InputSetAnswer, InputSetStatus, InputVariable } from "../input-set/input-set.component";
import { TestAnswer, Test, TestStatus } from "../test/test.component";
import { ChartSet } from "../chart-set/chart-set.component";
import { PageScrollService, PageScrollInstance } from "ng2-page-scroll";
import { DOCUMENT } from "@angular/platform-browser";
import { MathSymbolConverter } from "../../../utils/MathSymbolConverter";
import { ITestDto } from "../../data/test-set.api-protocol";

@Component({
  selector: 'task-flow',
  templateUrl: './task-flow.component.html',
  styleUrls: ['./task-flow.component.css'],
  providers: [ExamService]
})
export class TaskFlowComponent implements OnInit {
  @Input() task: IExamTaskFlowTaskData;

  @ViewChild('taskFlowContainer') private taskFlowContainer: ElementRef;

  step: TaskFlowStep = new LoadingTaskFlowStep();
  helpDataItems: HelpDataItem[] = [];

  @Output() onFinished = new EventEmitter<any>();

  constructor(private examService: ExamService,
              private pageScrollService: PageScrollService,
              @Inject(DOCUMENT) private document: Document) {}

  ngOnInit() {
    this.loadCurrentStep();
  }

  stepSubmitted(submittedData: any) {
    this.step.onSubmitted(submittedData);
  }

  stepContinue() {
    this.loadCurrentStep();
  }

  stepBack() {
    this.loadCurrentStep();
  }

  finish() {
    this.onFinished.emit();
  }

  private scrollToBottom(): void {
    let pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(this.document, '#scrollToBottomAnchor');
    this.pageScrollService.start(pageScrollInstance);
  }

  private loadCurrentStep() {
    this.step = new LoadingTaskFlowStep();
    let that = this;
    this.examService.getCurrentTaskFlowStep(this.task.examId, this.task.examStepSequence, this.task.examStepAttemptId, this.task.id)
      .subscribe((step: IExamTaskFlowStepData) => {
          console.log("Task flow step " + step.sequence + " loaded: ", step);
          if(step.helpData) {
            that.helpDataItems.push(new HelpDataItem(step.type, step.data));
            that.loadCurrentStep();
            return;
          }
          that.step = that.createStep(step);
          that.scrollToBottom()
        }
      );
  }

  private createStep(stepData: IExamTaskFlowStepData): TaskFlowStep {
    switch(stepData.type) {
      case TaskFlowStepTypes.Test:
        return new TestTaskFlowStep(this.task, stepData, this.examService);
      case TaskFlowStepTypes.InputSet:
        return new InputSetTaskFlowStep(this.task, stepData, this.examService);
      case TaskFlowStepTypes.Charts:
        return new ChartSetTaskFlowStep(this.task, stepData);
      case TaskFlowStepTypes.Finished:
        this.finish();
        return new LoadingTaskFlowStep();
      default: throw "Invalid task flow step types received: '" + stepData.type + "'";
    }
  }

}

abstract class TaskFlowStep {
  id: number;
  type: string;
  sequence: number;
  name: string;
  data: any;
  constructor(public taskData: IExamTaskFlowTaskData, stepData: IExamTaskFlowStepData) {
    this.id = stepData.id;
    this.type = stepData.type;
    this.sequence = stepData.sequence;
    this.name = stepData.name;
    this.fillData(stepData.data); //should be the last expression to allow to use other fields inside
  }
  abstract onSubmitted(submittedData: any): void
  abstract fillData(data: any): void
}

class HelpDataItem {
  constructor(public type: string, public data: any) {}
}

class InputSetTaskFlowStep extends TaskFlowStep {
  data: InputSetData;
  constructor(taskData: IExamTaskFlowTaskData, stepData: IExamTaskFlowStepData, public examService: ExamService) {
    super(taskData, stepData);
  }

  onSubmitted(submittedData: InputSetAnswer): void {
    console.log("Verify input set answer: ", submittedData);
    let that = this;
    this.examService.verifyTaskFlowStepAnswer(
      this.taskData.examId,
      this.taskData.examStepSequence,
      this.taskData.examStepAttemptId,
      this.taskData.id,
      this.sequence,
      JSON.stringify(submittedData)
    ).subscribe((verified: IVerifiedTaskFlowStepAnswer) => {
      let verifiedIputSet: {[key: number]:boolean} = JSON.parse(verified.answer);
      that.data.variables.forEach(v => {
        v.correct = verifiedIputSet[v.id] || false;
      });
      that.data.status = verified.isCorrectAnswer ? InputSetStatus.Correct : InputSetStatus.Incorrect
    });
  }

  fillData(data: any): void {
    let preparedInputs = data.inputs.map((i: InputVariable) => {
      i.name = MathSymbolConverter.convertString(i.name);
      return i;
    });
    this.data = new InputSetData(data.id, this.sequence, this.name, preparedInputs);
  }
}

class TestTaskFlowStep extends TaskFlowStep {
  data: Test;
  constructor(taskData: IExamTaskFlowTaskData, stepData: IExamTaskFlowStepData, public examService: ExamService) {
    super(taskData, stepData);
  }

  onSubmitted(submittedData: TestAnswer): void {
    console.log("Verify test answer: ", submittedData);
    let that = this;
    this.examService.verifyTaskFlowStepAnswer(
      this.taskData.examId,
      this.taskData.examStepSequence,
      this.taskData.examStepAttemptId,
      this.taskData.id,
      this.sequence,
      JSON.stringify(submittedData)
    ).subscribe((verified: IVerifiedTaskFlowStepAnswer) => {
        let verifiedAnswer: {[key: number]:boolean} = JSON.parse(verified.answer);
        that.data.status = verified.isCorrectAnswer ? TestStatus.Correct : TestStatus.Incorrect;
        that.data.options.forEach(testOption => {
          //If an option was submitted and exists in the verified answer
          let result = verifiedAnswer[testOption.id];
          if(typeof result === 'boolean') {
            testOption.correct = result;
          }
        });
    });
  }

  fillData(data: any): void {
    let typedData = <ITestDto> data;
    this.data = new Test(typedData, this.sequence);
    this.data.sequence = this.sequence;
  }
}

class ChartSetTaskFlowStep extends TaskFlowStep {
  data: ChartSet;
  constructor(taskData: IExamTaskFlowTaskData, stepData: IExamTaskFlowStepData) {
    super(taskData, stepData);
  }

  onSubmitted(submittedData: any): void {}

  fillData(data: any): void {
    this.data = new ChartSet("", data); //empty title, it is displayed separately
  }
}

class LoadingTaskFlowStep extends TaskFlowStep {
  fillData(data: any): void {}
  onSubmitted(submittedData: any): void {}
  constructor() { super(null, <IExamTaskFlowStepData> { type: TaskFlowStepTypes.Loading }); }
}