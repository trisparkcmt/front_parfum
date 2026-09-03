/**
 * @file lib/errorMapper.ts
 * @description Maps API error responses to user-friendly messages
 * Handles common HTTP status codes and specific API error patterns
 */

export interface ApiError {
  response?: {
    status?: number;
    data?: {
      detail?: string;
      message?: string;
      errors?: Record<string, string[]>;
      [key: string]: any;
    };
  };
  message?: string;
}

const ERROR_MESSAGES_FR: Record<number, string> = {
  400: 'Requête invalide. Veuillez vérifier vos données.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  403: 'Vous n\'avez pas la permission d\'effectuer cette action.',
  404: 'La ressource demandée n\'existe pas.',
  409: 'Conflit avec les données existantes. Veuillez réessayer.',
  422: 'Les données fournies ne sont pas valides.',
  429: 'Trop de requêtes. Veuillez attendre avant de réessayer.',
  500: 'Erreur serveur. Veuillez réessayer plus tard.',
  503: 'Le service est temporairement indisponible.',
};

const ERROR_MESSAGES_EN: Record<number, string> = {
  400: 'Invalid request. Please check your data.',
  401: 'Your session has expired. Please log in again.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource does not exist.',
  409: 'Conflict with existing data. Please try again.',
  422: 'The provided data is invalid.',
  429: 'Too many requests. Please wait before retrying.',
  500: 'Server error. Please try again later.',
  503: 'The service is temporarily unavailable.',
};

/**
 * Maps API error to user-friendly message
 * @param error - The API error object
 * @param lang - Language code ('fr' or 'en')
 * @returns User-friendly error message
 */
export function mapErrorToUserMessage(
  error: ApiError,
  lang: 'fr' | 'en' = 'fr'
): string {
  // Network error
  if (!error.response) {
    return lang === 'fr'
      ? 'Problème de connexion. Veuillez vérifier votre internet.'
      : 'Connection error. Please check your internet.';
  }

  const status = error.response.status;
  const data = error.response.data;

  // Handle specific API error format
  if (data?.detail) {
    return data.detail;
  }

  if (data?.message) {
    return data.message;
  }

  // Handle field errors
  if (data?.errors && typeof data.errors === 'object') {
    const firstError = Object.values(data.errors)[0];
    if (Array.isArray(firstError) && firstError[0]) {
      return firstError[0];
    }
  }

  // Get message based on language and status
  const messages = lang === 'fr' ? ERROR_MESSAGES_FR : ERROR_MESSAGES_EN;
  const defaultMsg = lang === 'fr' ? 'Une erreur est survenue.' : 'An error occurred.';

  return (messages[status || 0] as string | undefined) || defaultMsg;
}

/**
 * Extracts first field error from API response
 * @param error - The API error object
 * @returns First field error or undefined
 */
export function getFirstFieldError(error: ApiError): string | undefined {
  const data = error.response?.data;

  if (data?.errors && typeof data.errors === 'object') {
    const firstError = Object.values(data.errors)[0];
    if (Array.isArray(firstError) && firstError[0]) {
      return firstError[0];
    }
  }

  return data?.detail || data?.message;
}
