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
}