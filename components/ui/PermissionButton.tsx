'use client';

import React from 'react';
import { Button } from './button';
import { usePermissions } from '../../contexts/PermissionContext';

interface PermissionButtonProps {
  module: string;
  action: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  module,
  action,
  children,
  className,
  variant = 'default',
  size = 'default',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) => {
  try {
    const { hasPermission, isLoading } = usePermissions();

    // If still loading, don't render the button yet
    if (isLoading) {
      return null;
    }

    // If user doesn't have permission, don't render the button
    if (!hasPermission(module, action)) {
      return null;
    }

    return (
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        type={type}
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  } catch (error) {
    // If PermissionContext is not available, don't render the button
    console.warn('PermissionButton: PermissionContext not available, hiding button');
    return null;
  }
};
