import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getTask = async (input: GetTaskInput): Promise<Task | null> => {
  try {
    // Query the tasks table for a task with the given ID
    const result = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Return the task if found, or null if not found
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
};