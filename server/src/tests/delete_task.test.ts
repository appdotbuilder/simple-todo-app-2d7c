import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input for creating a task to delete
const testCreateInput: CreateTaskInput = {
  title: 'Task to Delete',
  description: 'This task will be deleted in tests'
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // First create a task
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    // Verify task exists
    const beforeDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    expect(beforeDelete).toHaveLength(1);

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task no longer exists
    const afterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    expect(afterDelete).toHaveLength(0);
  });

  it('should return success when task does not exist', async () => {
    const nonExistentId = 99999;
    
    // Verify task doesn't exist
    const beforeDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, nonExistentId))
      .execute();
    
    expect(beforeDelete).toHaveLength(0);

    // Attempt to delete non-existent task
    const deleteInput: DeleteTaskInput = { id: nonExistentId };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task'
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2', 
        description: 'Second task'
      })
      .returning()
      .execute();

    const task3 = await db.insert(tasksTable)
      .values({
        title: 'Task 3',
        description: 'Third task'
      })
      .returning()
      .execute();

    // Delete middle task
    const deleteInput: DeleteTaskInput = { id: task2[0].id };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify other tasks still exist
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    
    const remainingIds = remainingTasks.map(task => task.id);
    expect(remainingIds).toContain(task1[0].id);
    expect(remainingIds).toContain(task3[0].id);
    expect(remainingIds).not.toContain(task2[0].id);
  });

  it('should delete task with null description', async () => {
    // Create task with null description
    const taskWithNullDesc = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null
      })
      .returning()
      .execute();

    const taskId = taskWithNullDesc[0].id;

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task was deleted
    const afterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    expect(afterDelete).toHaveLength(0);
  });

  it('should delete completed task', async () => {
    // Create a completed task
    const completedTask = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is already done',
        completed: true
      })
      .returning()
      .execute();

    const taskId = completedTask[0].id;

    // Delete the completed task
    const deleteInput: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task was deleted
    const afterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    expect(afterDelete).toHaveLength(0);
  });
});