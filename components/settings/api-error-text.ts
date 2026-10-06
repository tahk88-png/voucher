/**
 * Error texts that the account and security APIs (change password, profile,
 * delete account, TOTP, passkeys) send back in `{ error }`, mapped to keys
 * under `accountSecurity.apiErrors`. The English messages equal these texts,
 * so English output is unchanged; other languages get a translation.
 */
const API_ERROR_KEYS: Record<string, string> = {
  'Not authenticated': 'notAuthenticated',
  Unauthorized: 'unauthorized',
  'Too many attempts': 'tooManyAttempts',
  'Validation failed': 'validationFailed',
  'An unexpected error occurred': 'unexpected',
  'Database operation failed': 'databaseFailed',
  'Service temporarily unavailable': 'serviceUnavailable',
  'New password must be at least 8 characters': 'newPasswordTooShort',
  'User not found': 'userNotFound',
  'Current password is required': 'currentPasswordRequired',
  'Current password is incorrect': 'currentPasswordIncorrect',
  'Account deletion is temporarily unavailable. Please contact support.': 'deletionUnavailable',
  '2FA is already enabled. Disable it first to reconfigure.': 'totpAlreadyEnabledReconfigure',
  'A 6-digit code is required': 'sixDigitCodeRequired',
  'No TOTP setup found. Please start the setup process first.': 'totpSetupMissing',
  '2FA is already enabled': 'totpAlreadyEnabled',
  'Invalid code. Please check your authenticator app and try again.': 'invalidSetupCode',
  'A verification code is required': 'verificationCodeRequired',
  '2FA is not currently enabled': 'totpNotEnabled',
  'Invalid code. Enter your current TOTP code or a backup code.': 'invalidDisableCode',
  'Failed to get registration options': 'passkeyOptionsFailed',
  'Failed to generate registration options': 'passkeyGenerateOptionsFailed',
  'Registration failed': 'registrationFailed',
  'Passkey registration failed': 'passkeyRegistrationFailed',
  'Challenge expired or not found': 'passkeyChallengeExpired',
  'Verification failed': 'verificationFailed',
  'Failed to verify registration': 'passkeyVerifyFailed',
};

/**
 * Text to show for an API error. `t` must be a translator for the
 * `accountSecurity` namespace. Known texts are translated, unknown ones are
 * shown as sent, and a missing error falls back to `fallback`.
 */
export function apiErrorText(t: (key: string) => string, error: unknown, fallback: string): string {
  if (typeof error !== 'string' || !error) return fallback;
  const key = API_ERROR_KEYS[error];
  return key ? t(`apiErrors.${key}`) : error;
}
