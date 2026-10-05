import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { completeOAuth } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    completeOAuth()
      .then(() => {
        if (active) navigate('/', { replace: true });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [completeOAuth, navigate]);

  return (
    <div className="max-w-md mx-auto p-8 text-center">
      <p role={failed ? 'alert' : 'status'}>{t(failed ? 'oauthFailed' : 'completing')}</p>
      {failed && (
        <Link className="text-indigo-700 underline" to="/login">
          {t('login')}
        </Link>
      )}
    </div>
  );
}
