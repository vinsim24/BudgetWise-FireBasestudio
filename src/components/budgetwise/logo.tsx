import { PiggyBank } from 'lucide-react';
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 text-primary">
      <PiggyBank className="h-8 w-8" />
      <span className="text-2xl font-headline font-bold">BudgetWise</span>
    </div>
  );
};

export default Logo;
