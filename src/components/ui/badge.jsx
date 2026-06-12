import { cn } from '@/lib/utils';
const variants = {
  default: 'bg-gray-100 text-gray-700',
  brand:   'bg-brand-50 text-brand-600',
  green:   'bg-green-50 text-green-700',
  red:     'bg-red-50 text-red-600',
  yellow:  'bg-yellow-50 text-yellow-700',
};
export function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
