import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper to create a test task
const createTestTask = async () => {
  const result = await db.insert(tasksTable)
    .values({
      title: 'Original Task',
      description: 'Original description',
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title only', async () => {
    const task = await createTestTask();
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.created_at).toEqual(task.created_at); // Unchanged
    expect(result.updated_at).not.toEqual(task.updated_at); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task description only', async () => {
    const task = await createTestTask();
    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Original Task'); // Unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.updated_at).not.toEqual(task.updated_at); // Should be updated
  });

  it('should update completed status only', async () => {
    const task = await createTestTask();
    const updateInput: UpdateTaskInput = {
      id: task.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Original Task'); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.completed).toEqual(true);
    expect(result.updated_at).not.toEqual(task.updated_at); // Should be updated
  });

  it('should update multiple fields at once', async () => {
    const task = await createTestTask();
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Completely Updated Task',
      description: 'New description',
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Completely Updated Task');
    expect(result.description).toEqual('New description');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(task.created_at); // Unchanged
    expect(result.updated_at).not.toEqual(task.updated_at); // Should be updated
  });

  it('should set description to null', async () => {
    const task = await createTestTask();
    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Original Task'); // Unchanged
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.updated_at).not.toEqual(task.updated_at); // Should be updated
  });

  it('should save changes to database', async () => {
    const task = await createTestTask();
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Database Updated Task',
      completed: true
    };

    await updateTask(updateInput);

    // Verify changes were persisted
    const updatedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(updatedTask).toHaveLength(1);
    expect(updatedTask[0].title).toEqual('Database Updated Task');
    expect(updatedTask[0].completed).toEqual(true);
    expect(updatedTask[0].description).toEqual('Original description');
    expect(updatedTask[0].updated_at).not.toEqual(task.updated_at);
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/task with id 999 not found/i);
  });

  it('should update only timestamp when no fields provided', async () => {
    const task = await createTestTask();
    const updateInput: UpdateTaskInput = {
      id: task.id
      // No fields to update
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual(task.title); // Unchanged
    expect(result.description).toEqual(task.description); // Unchanged
    expect(result.completed).toEqual(task.completed); // Unchanged
    expect(result.created_at).toEqual(task.created_at); // Unchanged
    expect(result.updated_at).not.toEqual(task.updated_at); // Should be updated
  });

  it('should handle task with null description initially', async () => {
    // Create task with null description
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute();
    
    const task = taskResult[0];

    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: 'Now has description'
    };

    const result = await updateTask(updateInput);

    expect(result.description).toEqual('Now has description');
    expect(result.title).toEqual('Task with null description'); // Unchanged
  });
});