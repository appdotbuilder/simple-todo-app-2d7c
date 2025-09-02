import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating new tasks
  const [newTaskForm, setNewTaskForm] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  // Form state for editing existing tasks
  const [editTaskForm, setEditTaskForm] = useState<UpdateTaskInput>({
    id: 0,
    title: '',
    description: null
  });

  // Load tasks from the API
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    try {
      setIsLoading(true);
      const newTask = await trpc.createTask.mutate(newTaskForm);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setNewTaskForm({ title: '', description: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle task completion status
  const handleToggleTask = async (taskId: number) => {
    try {
      const updatedTask = await trpc.toggleTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => 
        prev.map((task: Task) => task.id === taskId ? updatedTask : task)
      );
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  // Open edit dialog and populate form
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskForm({
      id: task.id,
      title: task.title,
      description: task.description
    });
    setIsEditDialogOpen(true);
  };

  // Update an existing task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTaskForm.title?.trim() || !editingTask) return;

    try {
      setIsLoading(true);
      const updatedTask = await trpc.updateTask.mutate(editTaskForm);
      setTasks((prev: Task[]) => 
        prev.map((task: Task) => task.id === editingTask.id ? updatedTask : task)
      );
      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const completedTasks = tasks.filter((task: Task) => task.completed);
  const pendingTasks = tasks.filter((task: Task) => !task.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✨ My Todo App
          </h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Stats and Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex gap-4">
            <Badge variant="secondary" className="text-sm">
              📋 Total: {tasks.length}
            </Badge>
            <Badge variant="outline" className="text-sm">
              ⏳ Pending: {pendingTasks.length}
            </Badge>
            <Badge variant="default" className="text-sm bg-green-500 hover:bg-green-600">
              ✅ Completed: {completedTasks.length}
            </Badge>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <Input
                    placeholder="What needs to be done? 🎯"
                    value={newTaskForm.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTaskForm((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                    }
                    className="text-base"
                    required
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Add some details... (optional)"
                    value={newTaskForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewTaskForm((prev: CreateTaskInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    className="resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !newTaskForm.title.trim()}>
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        {isLoading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your tasks...</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <Card className="text-center py-12 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent>
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks yet!</h3>
              <p className="text-gray-500 mb-4">Create your first task to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="text-yellow-500 mr-2">⏳</span>
                  Pending Tasks ({pendingTasks.length})
                </h2>
                <div className="space-y-3">
                  {pendingTasks.map((task: Task) => (
                    <TaskCard 
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            {pendingTasks.length > 0 && completedTasks.length > 0 && (
              <Separator className="my-6" />
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Completed Tasks ({completedTasks.length})
                </h2>
                <div className="space-y-3">
                  {completedTasks.map((task: Task) => (
                    <TaskCard 
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <Input
                  placeholder="Task title"
                  value={editTaskForm.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
                  }
                  className="text-base"
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Task description (optional)"
                  value={editTaskForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditTaskForm((prev: UpdateTaskInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !editTaskForm.title?.trim()}>
                  {isLoading ? 'Updating...' : 'Update Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md bg-white/70 backdrop-blur-sm border-0 shadow-sm ${
      task.completed ? 'opacity-75' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="mt-1">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggle(task.id)}
              className="w-5 h-5"
            />
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-gray-800 ${
              task.completed ? 'line-through text-gray-500' : ''
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-sm text-gray-600 mt-1 ${
                task.completed ? 'line-through' : ''
              }`}>
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>Created: {task.created_at.toLocaleDateString()}</span>
              {task.updated_at.getTime() !== task.created_at.getTime() && (
                <span>• Updated: {task.updated_at.toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0 hover:bg-blue-50"
            >
              <PencilIcon className="w-3 h-3" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-50 text-red-500 hover:text-red-600"
                >
                  <TrashIcon className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{task.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(task.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default App;