export class ExamStepTypes {
  static TestSet = 'test-set';
  static TaskFlow = 'task-flow';
  static Results = 'results';
  static sequence = [ExamStepTypes.TestSet, ExamStepTypes.TaskFlow, ExamStepTypes.Results];
  static getNext(examStepType: string): string {
    let index = this.sequence.indexOf(examStepType);
    let isLast = this.isLast(examStepType);
    if(index >= 0 && !isLast) {
      return this.sequence[index + 1];
    } else if(isLast){
      return null;
    } else {
      throw "Invalid ExamStepType passed: '" + examStepType + "'";
    }
  }
  static isLast(examStepType: string): boolean {
    let index = this.sequence.indexOf(examStepType);
    return index === this.sequence.length - 1
  }
}

export interface IUserDto {
  id: number;
  name: string;
  exam: IExamDto;
}

export interface IExamDto {
  id: number;
  name: string;
  description: string;
  currentStep: IExamStepPreview;
}

export interface IExamStepPreview {
  sequence: number;
  type: string;
  description: string
}

export interface IExamStepConf {
  id: number;
  examConfId: number;
  sequence: number;
  name: string;
  stepType: string;
  mistakesPerAttemptLimit: number;
  attemptsLimit: number
}

export interface IExamStepAttempt {
  id: number;
  userId: number;
  userExamId: number;
  examStepConfId: number;
  mistakesAmount: number;
  attemptNumber: number/*Starts with 1*/;
  status: string;
  stepVariantConfId: number;
  dataSetId: number
}

export interface IExamStepWithData {
  stepConf: IExamStepConf;
  attempt: IExamStepAttempt;
  stepData: any
}