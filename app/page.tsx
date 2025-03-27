"use client";

import { useState, useEffect } from "react";
import { PlusCircle, CheckCircle2, XCircle, Trash2, Clock, Github, Coffee, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getTodos, setTodos } from "./actions";
import { useSession } from "next-auth/react";
import { AuthButton } from "./components/auth-button";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time?: string;
  notified?: boolean;
  lastModified: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [todos, setLocalTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [newTime, setNewTime] = useState("");

  // Load todos from Redis on component mount
  useEffect(() => {
    const loadTodos = async () => {
      if (session?.user?.id) {
        const storedTodos = await getTodos();
        // Filter out expired todos (older than 24 hours)
        const now = Date.now();
        const validTodos = storedTodos.filter((todo: Todo) => {
          const age = now - todo.lastModified;
          return age < 24 * 60 * 60 * 1000; // Less than 24 hours old
        });
        setLocalTodos(validTodos);
      }
    };
    loadTodos();
  }, [session]);

  // Save todos to Redis whenever they change
  useEffect(() => {
    const saveTodos = async () => {
      if (session?.user?.id) {
        await setTodos(todos);
      }
    };
    if (todos.length > 0) {
      saveTodos();
    }
  }, [todos, session]);

  // Check for expired todos every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLocalTodos(prevTodos => 
        prevTodos.filter(todo => {
          const age = now - todo.lastModified;
          return age < 24 * 60 * 60 * 1000;
        })
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for notifications every minute
    const interval = setInterval(() => {
      const now = new Date();
      todos.forEach(todo => {
        if (todo.time && !todo.notified && !todo.completed) {
          const taskTime = new Date();
          const [hours, minutes] = todo.time.split(':');
          taskTime.setHours(parseInt(hours), parseInt(minutes), 0);

          // Calculate time difference in minutes
          const timeDiff = (taskTime.getTime() - now.getTime()) / (1000 * 60);

          // Notify 10 minutes before
          if (timeDiff <= 10 && timeDiff > 0) {
            new Notification(`Task Reminder: ${todo.text}`, {
              body: `Your task is due in ${Math.round(timeDiff)} minutes at ${todo.time}`,
            });
            setLocalTodos(prevTodos =>
              prevTodos.map(t =>
                t.id === todo.id ? { ...t, notified: true } : t
              )
            );
          }
        }
      });
    }, 60000);

    // Request notification permission
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (newTodo.trim()) {
      setLocalTodos([...todos, {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        time: newTime || undefined,
        notified: false,
        lastModified: Date.now()
      }]);
      setNewTodo("");
      setNewTime("");
    }
  };

  const toggleTodo = (id: number) => {
    if (!session) return;
    setLocalTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed, lastModified: Date.now() } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    if (!session) return;
    setLocalTodos(todos.filter(todo => todo.id !== id));
  };

  const formatTimeDisplay = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0);
      return format(date, 'HH:mm');
    } catch {
      return time;
    }
  };

  const formatTimeLeft = (lastModified: number) => {
    const now = Date.now();
    const timeLeft = 24 * 60 * 60 * 1000 - (now - lastModified);
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    return `${hoursLeft}h ${minutesLeft}m left`;
  };

  const completedTasks = todos.filter(todo => todo.completed).length;
  const totalTasks = todos.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-[#212922] text-white flex flex-col">
      <div className="max-w-3xl mx-auto p-6 flex-1 w-full">
        <div className="flex justify-between items-center mb-8 pt-12">
          <h1 className="text-4xl font-bold">Task Manager</h1>
          <AuthButton />
        </div>
        
        {session ? (
          <>
            <form onSubmit={addTodo} className="mb-8 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-3 rounded-lg bg-[#2c3530] border border-[#3c4a41] focus:outline-none focus:border-[#4c5a51] transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <PlusCircle size={20} />
                  Add
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-emerald-500" />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-[#2c3530] border border-[#3c4a41] focus:outline-none focus:border-[#4c5a51] transition-colors"
                />
              </div>
            </form>

            <div className="space-y-3">
              {todos.map(todo => (
                <div
                  key={todo.id}
                  className={cn(
                    "p-4 rounded-lg border flex items-center justify-between",
                    "bg-[#2c3530] border-[#3c4a41]",
                    todo.completed && "bg-opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={cn(
                        "p-1 rounded-full transition-colors",
                        todo.completed ? "text-emerald-500" : "text-gray-400 hover:text-emerald-500"
                      )}
                    >
                      {todo.completed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </button>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-lg",
                        todo.completed && "line-through text-gray-400"
                      )}>
                        {todo.text}
                      </span>
                      <div className="flex items-center gap-2 text-sm">
                        {todo.time && (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <Clock size={14} />
                            {formatTimeDisplay(todo.time)}
                          </span>
                        )}
                        <span className="text-gray-400">
                          {formatTimeLeft(todo.lastModified)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-2 text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              
              {todos.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No tasks yet. Add one to get started!
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Task Manager</h2>
            <p className="text-gray-400 mb-8">Please sign in to manage your tasks</p>
          </div>
        )}
      </div>

      <footer className="bg-[#1a201b] py-6 mt-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-emerald-500 font-semibold text-lg">Task Statistics</h3>
              <p className="text-gray-300">Total Tasks: {totalTasks}</p>
              <p className="text-gray-300">Completed: {completedTasks}</p>
              <p className="text-gray-300">Completion Rate: {completionRate}%</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-emerald-500 font-semibold text-lg">Features</h3>
              <ul className="text-gray-300 space-y-1">
                <li>✓ Task Management</li>
                <li>✓ Time Scheduling</li>
                <li>✓ 10-min Notifications</li>
                <li>✓ Progress Tracking</li>
                <li>✓ 24h Auto-cleanup</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-emerald-500 font-semibold text-lg">About</h3>
              <p className="text-gray-300">Built with Next.js and TypeScript</p>
              <div className="flex items-center gap-4 mt-3">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-500 transition-colors">
                  <Github size={20} />
                </a>
                <a href="https://ko-fi.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-500 transition-colors">
                  <Coffee size={20} />
                </a>
                <span className="text-gray-400 flex items-center gap-1">
                  Made with <Heart size={16} className="text-red-500" /> in 2024
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}