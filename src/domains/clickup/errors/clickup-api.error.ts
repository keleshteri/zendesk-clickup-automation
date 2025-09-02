/**
 * @type: error
 * @domain: clickup
 * @purpose: ClickUp API error handling
 * @solid-principle: SRP
 */

/**
 * ClickUp API Error class
 * Extends Error with additional API-specific information
 * Follows SRP by focusing only on error representation
 */
export class ClickUpAPIError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ClickUpAPIError';
  }
  
  isRateLimitError(): boolean {
    return this.code === 429;
  }
  
  isAuthenticationError(): boolean {
    return this.code === 401;
  }
  
  isAuthorizationError(): boolean {
    return this.code === 403;
  }
  
  isNotFoundError(): boolean {
    return this.code === 404;
  }
  
  isServerError(): boolean {
    return this.code >= 500;
  }
  
  isBadRequestError(): boolean {
    return this.code === 400;
  }
  
  isClientError(): boolean {
    return this.code >= 400 && this.code < 500;
  }
  
  /**
   * Create error from ClickUp API response
   */
  static fromApiResponse(response: {
    status: number;
    data?: any;
    statusText?: string;
  }): ClickUpAPIError {
    const message = response.data?.err || response.data?.message || response.statusText || 'Unknown API error';
    return new ClickUpAPIError(message, response.status, response.data);
  }
  
  /**
   * Create error from fetch response
   */
  static async fromResponse(response: Response): Promise<ClickUpAPIError> {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    const message = errorData.err || errorData.message || response.statusText || 'Unknown error';
    return new ClickUpAPIError(message, response.status, errorData);
  }
}