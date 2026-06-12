import { cn } from '@/lib/utils';
export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm',
        'text-gray-900 placeholder:text-gray-400 resize-none',
        'transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20',
        className
      )}
      {...props}
    />
  );
}
