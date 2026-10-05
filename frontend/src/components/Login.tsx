import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { apiError } from '../utils/apiError';
import { validate } from '../utils/validators';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Validates a single field and returns the i18n error key or empty string. */
function getFieldError(field: 'email' | 'fullName' | 'password', value: string): string {
  switch (field) {
    case 'email':
      return validate.email(value) ? '' : 'validation:emailInvalid';
    case 'password':
      return validate.password(value) ? '' : 'validation:passwordWeak';
    case 'fullName':
      return validate.fullName(value) ? '' : 'validation:fullNameInvalid';
    default:
      return '';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Login() {
  const { login, register, loginWithOAuth, oauthEnabled } = useAuth();
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);

  // Field values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Inline validation errors (shown only after the user touches a field)
  const [touched, setTouched] = useState({ email: false, password: false, fullName: false });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '', fullName: '' });

  // Submission state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  // ── Field change handlers ──────────────────────────────────────────────────

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      setFieldErrors((prev) => ({ ...prev, email: getFieldError('email', value) }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Only validate password strength during registration
    if (touched.password) {
      setFieldErrors((prev) => ({
        ...prev,
        password: isLogin
          ? value.length
            ? ''
            : 'validation:passwordRequired'
          : getFieldError('password', value),
      }));
    }
  };

  const handleFullNameChange = (value: string) => {
    setFullName(value);
    if (touched.fullName) {
      setFieldErrors((prev) => ({ ...prev, fullName: getFieldError('fullName', value) }));
    }
  };

  const markTouched = (field: 'email' | 'password' | 'fullName') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const values = { email, password, fullName };
    // Validate on blur; password strength only for registration
    if (field === 'password' && isLogin) {
      setFieldErrors((prev) => ({
        ...prev,
        password: password.length ? '' : 'validation:passwordRequired',
      }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: getFieldError(field, values[field]) }));
  };

  // ── Form validity ──────────────────────────────────────────────────────────

  const isFormValid = () => {
    if (!validate.email(email)) return false;
    if (password.length < 1 || password.length > 72) return false;
    if (!isLogin) {
      if (!validate.fullName(fullName)) return false;
      if (!validate.password(password)) return false;
    }
    return true;
  };

  // ── Submission ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Force-touch all fields to surface any remaining errors
    const newErrors = {
      email: getFieldError('email', email),
      password: !isLogin
        ? getFieldError('password', password)
        : password.length
          ? ''
          : 'validation:passwordRequired',
      fullName: !isLogin ? getFieldError('fullName', fullName) : '',
    };
    setFieldErrors(newErrors);
    setTouched({ email: true, password: true, fullName: true });

    if (!isFormValid()) return;

    setError('');
    setLoading(true);
    try {
      let success = false;
      if (isLogin) {
        success = await login(email, password);
      } else {
        success = await register(email, password, fullName);
      }
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('credentials');
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'apple') => {
    setOauthLoading(provider);
    setError('');
    try {
      await loginWithOAuth(provider);
    } catch {
      setError('oauth');
      setOauthLoading(null);
    }
  };

  // ── Reset on mode switch ───────────────────────────────────────────────────

  const switchMode = () => {
    setIsLogin((v) => !v);
    setError('');
    setFieldErrors({ email: '', password: '', fullName: '' });
    setTouched({ email: false, password: false, fullName: false });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">{t(isLogin ? 'login' : 'register')}</h1>

        {/* API / OAuth error banner */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm text-center"
          >
            {error === 'oauth' ? t('oauthFailed') : t(`common:errors.${error}`)}
          </div>
        )}

        {/* OAuth buttons */}
        {oauthEnabled && (
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading || !!oauthLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{t('withProvider', { provider: 'Google' })}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={loading || !!oauthLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              <span>{t('withProvider', { provider: 'GitHub' })}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('apple')}
              disabled={loading || !!oauthLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 11.22c-.09-.55-.3-1.24-.53-1.71 1.15-.45 1.95-1.48 1.95-2.79 0-1.62-1.03-2.94-2.66-3.28.12-.4.18-.82.18-1.25 0-.53-.14-1.02-.37-1.45-2.68.55-5.02 1.92-6.33 4.43-.42.8-1.06 2.02-.73 2.98.1.31.2.64.29.97C8.42 10.27 7 11.59 7 14.07c0 3.15 2.15 5.53 5.13 5.92.29.04.57.07.86.07.82 0 1.62-.11 2.39-.32.44-.12.86-.36 1.2-.62.09-.07.17-.13.25-.21v.64c-.43.35-.93.63-1.47.85-1.5.64-3.27.99-5.16.99-3.76 0-6.82-2.7-6.82-6.62 0-3.73 2.81-6.56 6.66-6.84.28 0 .55.01.82.03 1.47-.9 3.23-1.48 5.08-1.48 2.29 0 4.32.85 5.73 2.16l-.75 2.12c-1.76-.98-3.67-1.55-5.55-1.55-2.03 0-3.77 1.17-4.48 2.83-.15.35-.22.73-.22 1.1 0 .4.08.78.22 1.13.71 1.7 2.47 2.87 4.5 2.87 2.24 0 4.05-1.44 4.76-3.47.15-.42.23-.85.23-1.29 0-.64-.13-1.25-.36-1.83.95-.35 1.74-.88 2.24-1.52z" />
              </svg>
              <span>{t('withProvider', { provider: 'Apple' })}</span>
            </button>
          </div>
        )}

        {oauthEnabled && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('emailAlternative')}</span>
            </div>
          </div>
        )}

        {/* ── Main form ── */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full name — registration only */}
          {!isLogin && (
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium mb-1">
                {t('name')}
              </label>
              <input
                type="text"
                id="full-name"
                autoComplete="name"
                maxLength={120}
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                onBlur={() => markTouched('fullName')}
                className={`w-full p-2 border rounded transition-colors focus:outline-none focus:ring-2 ${
                  fieldErrors.fullName
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-indigo-300'
                }`}
                aria-describedby={fieldErrors.fullName ? 'fullname-error' : undefined}
                aria-invalid={!!fieldErrors.fullName}
                required={!isLogin}
              />
              {fieldErrors.fullName && (
                <p id="fullname-error" role="alert" className="mt-1 text-xs text-red-600">
                  {t(fieldErrors.fullName)}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              id="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => markTouched('email')}
              className={`w-full p-2 border rounded transition-colors focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-indigo-300'
              }`}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              aria-invalid={!!fieldErrors.email}
              required
            />
            {fieldErrors.email && (
              <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
                {t(fieldErrors.email)}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              {t('password')}
            </label>
            <input
              type="password"
              id="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => markTouched('password')}
              className={`w-full p-2 border rounded transition-colors focus:outline-none focus:ring-2 ${
                fieldErrors.password
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-indigo-300'
              }`}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              aria-invalid={!!fieldErrors.password}
              required
              minLength={isLogin ? 1 : 8}
              maxLength={72}
            />
            {/* Password strength hint — only during registration, before any error */}
            {!isLogin && !fieldErrors.password && (
              <p className="mt-1 text-xs text-gray-500">{t('validation:passwordWeak')}</p>
            )}
            {fieldErrors.password && (
              <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">
                {t(fieldErrors.password)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !!oauthLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? t('common:loading')
              : oauthLoading
                ? t('redirecting', { provider: oauthLoading })
                : t(isLogin ? 'login' : 'register')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {t(isLogin ? 'noAccount' : 'hasAccount')}{' '}
          <button
            disabled={loading || !!oauthLoading}
            onClick={switchMode}
            className="text-blue-600 hover:underline"
          >
            {t(isLogin ? 'register' : 'login')}
          </button>
        </p>
      </div>
    </div>
  );
}
