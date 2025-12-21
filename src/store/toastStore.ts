import { atom } from 'nanostores';

export type ToastMessage = {
  id: string;
  message: string;
  type: 'success' | 'error';
};

export const $toasts = atom<ToastMessage[]>([]);

export function addToast(message: string, type: 'success' | 'error' = 'success') {
  const id = Math.random().toString(36).substring(7);
  $toasts.set([...$toasts.get(), { id, message, type }]);
  setTimeout(() => {
    $toasts.set($toasts.get().filter(t => t.id !== id));
  }, 3000);
}
