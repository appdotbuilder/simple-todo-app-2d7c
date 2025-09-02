import { type UpdateTaskInput, type Task } from '../schema';

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is updating an existing task in the database.
    // It should:
    // 1. Find the task by ID
    // 2. Update only the provided fields (partial update)
    // 3. Update the updated_at timestamp
    // 4. Return the updated task
    // 5. Throw an error if the task is not found
    return Promise.resolve({
        id: input.id,
        title: input.title || 'Placeholder title',
        description: input.description !== undefined ? input.description : null,
        completed: input.completed || false,
        created_at: new Date(), // Placeholder - should preserve original
        updated_at: new Date() // Should be updated to current time
    } as Task);
}