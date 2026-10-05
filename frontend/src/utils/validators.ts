/**
 * Centralized regex patterns and validation helpers for form fields.
 */

export const REGEX = {
  /** Standard email: local@domain.tld — no leading/trailing whitespace, no double @ */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,

  /**
   * Password (registration only):
   *  - 8–72 characters
   *  - At least one uppercase letter
   *  - At least one digit
   *  - At least one special character (!@#$%^&*()_+\-={}|;':,./<>?)
   */
  password: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{}|;':",.<>?/]).{8,72}$/,

  /**
   * Full name:
   *  - 2–120 characters
   *  - Only letters (including accented/Latin-extended), spaces, hyphens and apostrophes
   */
  fullName: /^(?=.*\p{L})[\p{L}\p{M} '\u2019-]{2,120}$/u,
};

/**
 * Returns `true` when the value passes the pattern.
 */
export const validate = {
  email: (value: string) => value.trim().length <= 254 && REGEX.email.test(value.trim()),
  password: (value: string) => REGEX.password.test(value),
  fullName: (value: string) => REGEX.fullName.test(value.trim().normalize('NFC')),
};
