import { cn } from '@/lib/utils';
export function Label({ className, ...props }) {
  return (
    <label
      className={cn('block text-sm font-semibold text-gray-700 mb-1', className)}
      {...props}
    />
  );
}
