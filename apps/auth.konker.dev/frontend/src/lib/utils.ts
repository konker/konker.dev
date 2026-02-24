import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// eslint-disable-next-line fp/no-rest-parameters
export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs));
}
