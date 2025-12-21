import { useStore } from '@nanostores/react';
import { $toasts } from '../store/toastStore';
import { cn } from '../lib/utils';

export function ToastContainer() {
  const toasts = useStore($toasts);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            "px-4 py-2 rounded shadow text-white transition-opacity duration-300 pointer-events-auto",
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
