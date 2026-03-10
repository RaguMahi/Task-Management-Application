import { useState, useEffect } from 'react';
import { supabase, Task } from './lib/supabase';
import { Plus, Trash2, Check } from 'lucide-react';
import { AuthForm } from './components/AuthForm';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('tasks')
      .insert([{ title: newTaskTitle, user_id: user.id }]);

    if (error) {
      console.error('Error adding task:', error);
    } else {
      setNewTaskTitle('');
      fetchTasks();
    }
    setLoading(false);
  };

  const toggleTask = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed, updated_at: new Date().toISOString() })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      fetchTasks();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white">Task Manager</h1>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={addTask} className="mb-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-lg">No tasks yet. Add one to get started!</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                  >
                    <button
                      onClick={() => toggleTask(task)}
                      className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300 hover:border-blue-500'
                      }`}
                    >
                      {task.completed && <Check size={16} className="text-white" />}
                    </button>
                    <span
                      className={`flex-1 ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-700'
                      }`}
                    >
                      {task.title}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {tasks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500 text-center">
                  {tasks.filter((t) => !t.completed).length} of {tasks.length} tasks remaining
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
