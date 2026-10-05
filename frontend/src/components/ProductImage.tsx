import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ProductImage({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className: string;
}) {
  const { t } = useTranslation('productCard');
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      loading="lazy"
      className={className}
    />
  ) : (
    <div
      role="img"
      aria-label={t('noImage')}
      className={`bg-gray-100 text-gray-500 flex items-center justify-center text-sm ${className}`}
    >
      {t('noImage')}
    </div>
  );
}
