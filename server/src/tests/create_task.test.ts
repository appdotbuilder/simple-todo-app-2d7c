import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with title and description', async () => {
    const testInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'A task for testing'
    };

    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with only title (no description)', async () => {
    const testInput: CreateTaskInput = {
      title: 'Task without description'
    };

    const result = await createTask(testInput);

    expect(result.title).toEqual('Task without description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with null description', async () => {
    const testInput: CreateTaskInput = {
      title: 'Task with null description',
      description: null
    };

    const result = await createTask(testInput);

    expect(result.title).toEqual('Task with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const testInput: CreateTaskInput = {
      title: 'Database Test Task',
      description: 'This task should be saved to the database'
    };

    const result = await createTask(testInput);

    // Query the database to verify the task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Test Task');
    expect(tasks[0].description).toEqual('This task should be saved to the database');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple tasks with unique IDs', async () => {
    const testInput1: CreateTaskInput = {
      title: 'First Task',
      description: 'First task description'
    };

    const testInput2: CreateTaskInput = {
      title: 'Second Task',
      description: 'Second task description'
    };

    const result1 = await createTask(testInput1);
    const result2 = await createTask(testInput2);

    // Verify both tasks have unique IDs
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Verify both tasks exist in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(2);
    
    const taskTitles = allTasks.map(task => task.title);
    expect(taskTitles).toContain('First Task');
    expect(taskTitles).toContain('Second Task');
  });

  it('should set created_at and updated_at to current time', async () => {
    const beforeCreate = new Date();
    
    const testInput: CreateTaskInput = {
      title: 'Time Test Task',
      description: 'Testing timestamp generation'
    };

    const result = await createTask(testInput);
    const afterCreate = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at >= beforeCreate).toBe(true);
    expect(result.created_at <= afterCreate).toBe(true);
    expect(result.updated_at >= beforeCreate).toBe(true);
    expect(result.updated_at <= afterCreate).toBe(true);

    // In most cases, created_at and updated_at should be very close or identical
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});