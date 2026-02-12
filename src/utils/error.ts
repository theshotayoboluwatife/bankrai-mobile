const isDebug = process.env.EXPO_PUBLIC_DEBUG === 'true';

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Returns the actual error message only when EXPO_PUBLIC_DEBUG=true,
 * otherwise returns a generic fallback.
 */
export function getDisplayError(error: unknown, fallback?: string): string {
  if (isDebug) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return fallback || DEFAULT_MESSAGE;
  }
  return fallback || DEFAULT_MESSAGE;
}
