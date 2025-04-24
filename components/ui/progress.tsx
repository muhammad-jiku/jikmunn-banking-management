'use client';

import { cn } from '@/lib/utils';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

// Define the props interface properly
interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  value?: number;
}

// Create the forwardRef component correctly
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  function Progress(
    { className, value = 0, indicatorClassName, ...props },
    ref
  ) {
    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full flex-1 bg-primary transition-all',
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - value}%)` }}
        />
      </ProgressPrimitive.Root>
    );
  }
);

// The correct way to set displayName
Progress.displayName = 'Progress';

export { Progress };
export type { ProgressProps };
