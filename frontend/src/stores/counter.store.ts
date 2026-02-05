import { create } from "zustand";

export interface CounterStateType {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterStateType>((set) => ({
  count: 0,
  increment: () => set((state: CounterStateType) => ({ count: state.count + 1 })),
  decrement: () => set((state: CounterStateType) => ({ count: state.count - 1 }))
}));
