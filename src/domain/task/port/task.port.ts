import type {Task} from "../model/task";
import type {CreateTaskInput} from "../model/create-task-input";

export interface TaskPort {
  findByEmail(email: string): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
}