import { ExamService } from "../exam/data/exam-service.service";
import { ExamStepTypes } from "../exam/data/exam.api-protocol";
import { ExamStep } from "./exam.step";
import { IExamTaskFlowTaskData } from "../exam/data/i-exam-task-flow-task-data";

export class TaskFlowExamStep extends ExamStep {
  taskData: IExamTaskFlowTaskData;

  constructor(private examService: ExamService, examId: number, sequence: number, description: string) {
    super(sequence, examId, ExamStepTypes.TaskFlow, description);
  }

  loadInitialData() {
    this.examService.getExamTask(this.examId).subscribe((examTask: IExamTaskFlowTaskData) => {
      console.log("Task loaded: ", examTask);
      this.taskData = examTask;
      this.isLoading = false;
    })
  };
}
