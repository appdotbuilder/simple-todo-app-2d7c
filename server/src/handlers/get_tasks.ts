import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { desc } from 'drizzle-orm';

export const getTasks = async (): Promise<Task[]> => {
  try {
    // Query all tasks, ordered by updated_at descending for most recent first
    const results = await db.select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.updated_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};