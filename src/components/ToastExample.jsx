import React from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';

const ToastExample = () => {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button onClick={() => toast.success('Success message!')}>
        Success Toast
      </Button>
      
      <Button onClick={() => toast.error('Error message!')}>
        Error Toast
      </Button>
      
      <Button onClick={() => toast.warning('Warning message!')}>
        Warning Toast
      </Button>
      
      <Button onClick={() => toast.info('Info message!')}>
        Info Toast
      </Button>
      
      <Button onClick={() => toast.loading('Loading...')}>
        Loading Toast
      </Button>
      
      <Button onClick={() => toast('Basic message')}>
        Basic Toast
      </Button>
    </div>
  );
};

export default ToastExample;