import { cn } from '@/lib/utils';

const variants = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger:    'bg-red-600 text-white hover:bg-red-700',
  outline:   'border border-brand-600 text-brand-600 hover:bg-brand-50',
};

const sizes = {
  sm:   'px-3 py-2 sm:py-1.5 text-xs sm:text-sm h-9 sm:h-auto',
  md:   'px-4 py-2.5 sm:py-2 text-sm h-11 sm:h-auto',
  lg:   'px-5 py-3 sm:py-2.5 text-base h-12 sm:h-auto',
  icon: 'p-2.5 h-10 sm:h-auto',
};

/**
 * ChowSpot button.
 * @param {'primary'|'secondary'|'ghost'|'danger'|'outline'} variant
 * @param {'sm'|'md'|'lg'|'icon'} size
 */
export function Button({ variant = 'primary', size = 'md', className, disabled, children, ...props }) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-colors duration-150 focus-visible:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
