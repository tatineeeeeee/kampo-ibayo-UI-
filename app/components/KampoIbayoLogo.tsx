import React from 'react';
import Image from 'next/image';

interface KampoIbayoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export const KampoIbayoLogo: React.FC<KampoIbayoLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'horizontal'
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  if (!showText) {
    return (
      <div className={`${sizeClasses[size]} relative ${className}`}>
        <Image
          src="/logo.png"
          alt="Kampo Ibayo Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className={`${sizeClasses[size]} relative`}>
          <Image
            src="/logo.png"
            alt="Kampo Ibayo Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className={`${textSizeClasses[size]} font-bold text-center`}>
          <div className="text-red-500">Kampo</div>
          <div className="text-gray-700">Ibayo</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <Image
          src="/logo.png"
          alt="Kampo Ibayo Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className={`${textSizeClasses[size]} font-bold`}>
        <span className="text-red-500">Kampo</span>{' '}
        <span className="text-gray-700">Ibayo</span>
      </div>
    </div>
  );
};

export default KampoIbayoLogo;