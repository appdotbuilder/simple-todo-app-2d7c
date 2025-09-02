import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskInput, type CreateTaskInput } from '../schema';
import { toggleTask } from '../handlers/toggle_task';
import { eq } from 'drizzle-orm';

// Test input for toggling
const testToggleInput: ToggleTaskInput = {
  id: 1
};

// Helper function to create a test task
const createTestTask = async (completed: boolean = false): Promise<number> => {
  const testTaskInput: CreateTaskInput = {
    title: 'Test Task',
    description: 'A task for testing'
  };

  const result = await db.insert(tasksTable)
    .values({
      title: testTaskInput.title,
      description: testTaskInput.description,
      completed
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('toggleTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle task from false to true', async () => {
    // Create a task with completed = false
    const taskId = await createTestTask(false);
    
    const result = await toggleTask({ id: taskId });

    // Verify the task is now completed
    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should toggle task from true to false', async () => {
    // Create a task with completed = true
    const taskId = await createTestTask(true);
    
    const result = await toggleTask({ id: taskId });

    // Verify the task is now not completed
    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Create a task and get its initial timestamp
    const taskId = await createTestTask(false);
    
    // Get the original updated_at timestamp
    const originalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    const originalUpdatedAt = originalTask[0].updated_at;
    
    // Add a small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result = await toggleTask({ id: taskId });

    // Verify updated_at was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should save the toggled state to database', async () => {
    // Create a task with completed = false
    const taskId = await createTestTask(false);
    
    await toggleTask({ id: taskId });

    // Query the database directly to verify the change was persisted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].completed).toBe(true);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
  });

  it('should throw error when task does not exist', async () => {
    // Try to toggle a non-existent task
    const nonExistentId = 999;
    
    await expect(toggleTask({ id: nonExistentId }))
      .rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should preserve all other task fields', async () => {
    // Create a task with specific values
    const taskInput = {
      title: 'Important Task',
      description: 'Very important description'
    };

    const createResult = await db.insert(tasksTable)
      .values({
        ...taskInput,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;
    const originalCreatedAt = createResult[0].created_at;
    
    const result = await toggleTask({ id: taskId });

    // Verify all fields are preserved except completed and updated_at
    expect(result.title).toEqual(taskInput.title);
    expect(result.description).toEqual(taskInput.description);
    expect(result.completed).toBe(true); // Should be toggled
    expect(result.created_at).toEqual(originalCreatedAt); // Should be preserved
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle task with null description', async () => {
    // Create a task with null description
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;
    
    const result = await toggleTask({ id: taskId });

    expect(result.title).toEqual('Task with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toBe(true);
  });
});