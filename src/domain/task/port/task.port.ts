import type {Task} from "../model/task";
import type {CreateTaskInput} from "../model/create-task-input";

export interface TaskPort {
  findByEmail(email: string): Promise<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    deadline: Date | null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }[]>;

  create(input: CreateTaskInput): Promise<Task>;
}