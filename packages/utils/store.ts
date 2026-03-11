import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// Define the shape of our counter store
interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  incrementBy: (amount: number) => void;
}

// Create a reusable counter store with persistence
export const useCounterStore = create<CounterStore>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
      reset: () => set({ count: 0 }),
      incrementBy: (amount: number) => set((state) => ({ count: state.count + amount })),
    }),
    {
      name: 'counter-storage', // Unique name for localStorage key
    }
  )
);

// Define the shape of our user store
interface UserStore {
  user: { id: string; name: string; email: string } | null;
  setUser: (user: { id: string; name: string; email: string }) => void;
  clearUser: () => void;
  isLoggedIn: boolean;
}

// Create a reusable user store with persistence
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      get isLoggedIn() {
        return !!get().user;
      },
    }),
    {
      name: 'user-storage', // Unique name for localStorage key
    }
  )
);

// Example of a more complex store with derived values
interface TodoStore {
  todos: { id: string; text: string; completed: boolean }[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  completedCount: number;
  incompleteCount: number;
}

export const useTodoStore = create<TodoStore>()(
  subscribeWithSelector(
    (set, get) => ({
      todos: [],
      addTodo: (text) =>
        set((state) => ({
          todos: [
            ...state.todos,
            { id: Math.random().toString(36).substr(2, 9), text, completed: false },
          ],
        })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),
      removeTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
      get completedCount() {
        return get().todos.filter((todo) => todo.completed).length;
      },
      get incompleteCount() {
        return get().todos.filter((todo) => !todo.completed).length;
      },
    })
  )
);
