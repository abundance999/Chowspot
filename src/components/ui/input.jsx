import { cn } from '@/lib/utils';
export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-gray-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm',
        'text-gray-900 placeholder:text-gray-400',
        'transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20',
        'disabled:bg-gray-50 disabled:cursor-not-allowed',
        'min-h-10 sm:min-h-auto',
        className
      )}
      {...props}
    />
  );
}
