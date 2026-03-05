import { useSyncExternalStore } from 'react';

export type ConfirmVariant = 'default' | 'destructive';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
}

let state: ConfirmState = {
  isOpen: false,
  options: null,
  resolve: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const confirmStore = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  confirm: (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      state = {
        isOpen: true,
        options,
        resolve,
      };
      notify();
    });
  },
  close: (value: boolean) => {
    if (state.resolve) {
      state.resolve(value);
    }
    state = {
      isOpen: false,
      options: state.options, // 保持 options 以便动画过渡
      resolve: null,
    };
    notify();
  },
};

export function useConfirmState() {
  return useSyncExternalStore(confirmStore.subscribe, confirmStore.getState, confirmStore.getState);
}

export function useConfirm() {
  return confirmStore.confirm;
}
