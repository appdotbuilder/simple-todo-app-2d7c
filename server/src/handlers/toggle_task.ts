import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export async function toggleTask(input: ToggleTaskInput): Promise<Task> {
  try {
    // First, get the current task to know its current completion status
    const currentTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (currentTask.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const task = currentTask[0];
    
    // Toggle the completed status and update the updated_at timestamp
    const result = await db.update(tasksTable)
      .set({
        completed: !task.completed, // Toggle the current status
        updated_at: new Date() // Update the timestamp
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task toggle failed:', error);
    throw error;
  }
}