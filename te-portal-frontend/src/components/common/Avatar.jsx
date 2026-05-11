import React from 'react';
import { getImageUrl } from '../../utils/imageUtils';

const Avatar = ({
  src,
  name,
  size = 'md',
  online = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const imageUrl = getImageUrl(src);

  return (
    <div className="relative inline-block">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-lg object-cover shadow-sm`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm`}>
          {initial}
        </div>
      )}

      {online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};

export default Avatar;