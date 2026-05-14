import type {Task} from "../model/task";
import type {CreateTaskInput} from "../model/create-task-input";
import type {UpdateTaskInput} from "../model/udate-task-input";

export interface TaskPort {
  findByEmail(email: string): Promise<Task[]>;
  findById(taskId: string): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(input: UpdateTaskInput): Promise<Task | null>;
  delete(taskId: string): Promise<void>;
}