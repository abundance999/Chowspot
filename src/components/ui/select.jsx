import { cn } from '@/lib/utils';
export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900',
        'transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
