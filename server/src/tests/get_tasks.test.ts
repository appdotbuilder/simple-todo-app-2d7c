import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all tasks', async () => {
    // Create test tasks directly in database
    await db.insert(tasksTable)
      .values([
        {
          title: 'First Task',
          description: 'First task description',
          completed: false
        },
        {
          title: 'Second Task', 
          description: null, // Test null description
          completed: true
        },
        {
          title: 'Third Task',
          description: 'Third task description',
          completed: false
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Verify all tasks are returned
    const titles = result.map(task => task.title);
    expect(titles).toContain('First Task');
    expect(titles).toContain('Second Task');
    expect(titles).toContain('Third Task');
  });

  it('should return tasks with correct field types', async () => {
    await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Test description',
        completed: true
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];

    // Verify field types and structure
    expect(typeof task.id).toBe('number');
    expect(typeof task.title).toBe('string');
    expect(typeof task.description).toBe('string');
    expect(typeof task.completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);

    // Verify field values
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Test description');
    expect(task.completed).toBe(true);
  });

  it('should handle null description properly', async () => {
    await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];

    expect(task.title).toBe('Task with null description');
    expect(task.description).toBeNull();
    expect(task.completed).toBe(false);
  });

  it('should return tasks ordered by updated_at descending', async () => {
    // Insert tasks with slight delays to ensure different timestamps
    await db.insert(tasksTable)
      .values({
        title: 'First Task',
        description: 'Created first',
        completed: false
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({
        title: 'Second Task',
        description: 'Created second',
        completed: false
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({
        title: 'Third Task',
        description: 'Created third',
        completed: false
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recently updated first
    expect(result[0].title).toBe('Third Task');
    expect(result[1].title).toBe('Second Task');
    expect(result[2].title).toBe('First Task');

    // Verify timestamps are in descending order
    expect(result[0].updated_at.getTime()).toBeGreaterThanOrEqual(result[1].updated_at.getTime());
    expect(result[1].updated_at.getTime()).toBeGreaterThanOrEqual(result[2].updated_at.getTime());
  });

  it('should return tasks with different completion status', async () => {
    await db.insert(tasksTable)
      .values([
        {
          title: 'Completed Task',
          description: 'This is done',
          completed: true
        },
        {
          title: 'Pending Task',
          description: 'This is not done',
          completed: false
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    const completedTask = result.find(task => task.completed === true);
    const pendingTask = result.find(task => task.completed === false);

    expect(completedTask).toBeDefined();
    expect(completedTask?.title).toBe('Completed Task');
    
    expect(pendingTask).toBeDefined();
    expect(pendingTask?.title).toBe('Pending Task');
  });
});