import type {Task} from "../model/task";
import type {CreateTaskInput} from "../model/create-task-input";
import type {UpdateTaskInput} from "../model/udate-task-input";
import type {GetTaskByIdInput} from "../model/get-task-by-id-input";

export interface TaskPort {
  findByEmail(email: string): Promise<Task[]>;
  findById(input: GetTaskByIdInput): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(input: UpdateTaskInput): Promise<Task | null>;
}