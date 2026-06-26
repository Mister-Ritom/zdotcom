/**
 * Helper utility to convert developer/technical error messages into clean, user-friendly messages.
 */
export function getCleanErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  let message = '';
  let status: number | undefined;
  let code: string | undefined;

  if (error instanceof Error) {
    message = error.message;
    if ('status' in error) {
      status = (error as any).status;
    }
    if ('code' in error) {
      code = (error as any).code;
    }
  } else if (typeof error === 'object') {
    message = (error as any).message || '';
    status = (error as any).status;
    code = (error as any).code;
  } else {
    message = String(error);
  }

  const cleanMessage = message.trim();
  const lowerMessage = cleanMessage.toLowerCase();

  // 1. Check by status code (e.g. rate limiting / too many requests)
  if (status === 429 || lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return 'Too many requests. Please try again in a few minutes.';
  }

  // 2. Check for network connection failures
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('offline')
  ) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  // 3. Map specific message strings or error codes
  if (
    code === 'invalid_credentials' ||
    lowerMessage.includes('invalid credentials') ||
    lowerMessage.includes('invalid login credentials')
  ) {
    return 'Incorrect email or password. Please try again.';
  }

  if (
    code === 'user_already_exists' ||
    lowerMessage.includes('user already registered') ||
    lowerMessage.includes('email already in use') ||
    lowerMessage.includes('email already registered')
  ) {
    return 'An account with this email address already exists. Try signing in instead.';
  }

  if (
    code === 'email_address_invalid' ||
    lowerMessage.includes('email must be valid') ||
    lowerMessage.includes('invalid email')
  ) {
    return 'Please enter a valid email address.';
  }

  if (
    lowerMessage.includes('password should be at least') ||
    lowerMessage.includes('password must be at least') ||
    lowerMessage.includes('valid password') ||
    lowerMessage.includes('signup requires a valid password')
  ) {
    return 'Password must be at least 6 characters long.';
  }

  if (
    code === 'email_not_confirmed' ||
    lowerMessage.includes('email not confirmed') ||
    lowerMessage.includes('confirm your email')
  ) {
    return 'Please confirm your email address first.';
  }

  if (lowerMessage.includes('google sign-in: idtoken is null')) {
    return 'Google Sign-In failed: Client was unable to retrieve a secure token. Please try again.';
  }

  if (lowerMessage.includes('sign_in_cancelled') || lowerMessage.includes('cancel')) {
    return 'Sign in was cancelled.';
  }

  // If the message is a short, simple user-facing sentence, return it.
  // Otherwise, fallback to a clean generic message.
  if (
    cleanMessage &&
    cleanMessage.length < 80 &&
    !cleanMessage.includes('Error:') &&
    !cleanMessage.includes('{') &&
    !cleanMessage.includes('[') &&
    !cleanMessage.includes('AuthApiError')
  ) {
    return cleanMessage;
  }

  return 'An unexpected error occurred. Please try again.';
}
