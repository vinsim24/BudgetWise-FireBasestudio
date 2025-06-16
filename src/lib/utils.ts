import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getIcon(iconName: string) {
  // Dynamically import lucide-react icons.
  // This is a basic example. For a large number of icons,
  // consider a more robust solution or pre-importing common icons.
  const LucideIcons = require('lucide-react');
  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons];
  if (IconComponent) {
    return IconComponent;
  }
  return LucideIcons.HelpCircle; // Default icon
}
