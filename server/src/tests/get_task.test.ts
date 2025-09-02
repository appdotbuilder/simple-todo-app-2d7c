import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when it exists', async () => {
    // Create a test task first
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing retrieval',
        completed: false
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    const input: GetTaskInput = { id: createdTask.id };

    // Get the task
    const result = await getTask(input);

    // Verify the task was returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.title).toEqual('Test Task');
    expect(result!.description).toEqual('A task for testing retrieval');
    expect(result!.completed).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task does not exist', async () => {
    const input: GetTaskInput = { id: 999 }; // Non-existent ID

    const result = await getTask(input);

    expect(result).toBeNull();
  });

  it('should handle task with null description', async () => {
    // Create a task with null description
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Task with No Description',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    const input: GetTaskInput = { id: createdTask.id };

    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Task with No Description');
    expect(result!.description).toBeNull();
    expect(result!.completed).toBe(true);
  });

  it('should handle completed task correctly', async () => {
    // Create a completed task
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is done',
        completed: true
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    const input: GetTaskInput = { id: createdTask.id };

    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.completed).toBe(true);
    expect(result!.title).toEqual('Completed Task');
  });

  it('should return different tasks for different IDs', async () => {
    // Create multiple test tasks
    const insertResult = await db.insert(tasksTable)
      .values([
        {
          title: 'First Task',
          description: 'First task description',
          completed: false
        },
        {
          title: 'Second Task',
          description: 'Second task description',
          completed: true
        }
      ])
      .returning()
      .execute();

    const firstTask = insertResult[0];
    const secondTask = insertResult[1];

    // Get the first task
    const firstResult = await getTask({ id: firstTask.id });
    expect(firstResult).not.toBeNull();
    expect(firstResult!.title).toEqual('First Task');
    expect(firstResult!.completed).toBe(false);

    // Get the second task
    const secondResult = await getTask({ id: secondTask.id });
    expect(secondResult).not.toBeNull();
    expect(secondResult!.title).toEqual('Second Task');
    expect(secondResult!.completed).toBe(true);

    // Ensure they're different
    expect(firstResult!.id).not.toEqual(secondResult!.id);
  });
});