"use server";

import { auth } from "@/auth";
import { redis } from "@/lib/redis"; // Import your NextAuth configuration

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time?: string;
  notified?: boolean;
  lastModified: number;
}

// ✅ Fetch todos from Redis (Ensure it always returns an array)
export async function getTodos(): Promise<Todo[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const key = `todos:${session.user.id}`;
    const todos = await redis.get(key);

    // Ensure the result is always an array
    return Array.isArray(todos) ? todos : [];
  } catch (error) {
    console.error("Failed to get todos:", error);
    return [];
  }
}

// ✅ Save todos to Redis
export async function setTodos(todos: Todo[]): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  try {
    const key = `todos:${session.user.id}`;
    await redis.set(key, JSON.stringify(todos), { ex: 24 * 60 * 60 }); // 24-hour expiration
    return true;
  } catch (error) {
    console.error("Failed to set todos:", error);
    return false;
  }
}
