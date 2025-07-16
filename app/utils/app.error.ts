/**
 * Custom error class for application-specific errors
 * Extends the built-in Error class with additional properties
 */
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  errorCode?: string;
  errors?: any[];

  /**
   * Create a new AppError
   * @param message Error message
   * @param statusCode HTTP status code (defaults to 500)
   * @param errorCode Optional error code for client identification
   * @param errors Optional array of validation errors
   */
  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    errors?: any[],
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Indicates if this is an operational error
    this.errorCode = errorCode;
    this.errors = errors;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   * @param message Error message
   * @param errorCode Optional error code
   * @param errors Optional validation errors
   */
  static badRequest(
    message: string,
    errorCode?: string,
    errors?: any[],
  ): AppError {
    return new AppError(message, 400, errorCode, errors);
  }

  /**
   * Create a 401 Unauthorized error
   * @param message Error message
   * @param errorCode Optional error code
   */
  static unauthorized(
    message: string = "Unauthorized",
    errorCode?: string,
  ): AppError {
    return new AppError(message, 401, errorCode);
  }

  /**
   * Create a 403 Forbidden error
   * @param message Error message
   * @param errorCode Optional error code
   */
  static forbidden(
    message: string = "Forbidden",
    errorCode?: string,
  ): AppError {
    return new AppError(message, 403, errorCode);
  }

  /**
   * Create a 404 Not Found error
   * @param message Error message
   * @param errorCode Optional error code
   */
  static notFound(
    message: string = "Resource not found",
    errorCode?: string,
  ): AppError {
    return new AppError(message, 404, errorCode);
  }

  /**
   * Create a 422 Unprocessable Entity error
   * @param message Error message
   * @param errorCode Optional error code
   * @param errors Optional validation errors
   */
  static validation(
    message: string,
    errorCode?: string,
    errors?: any[],
  ): AppError {
    return new AppError(message, 422, errorCode, errors);
  }

  /**
   * Create a 500 Internal Server Error
   * @param message Error message
   * @param errorCode Optional error code
   */
  static internal(
    message: string = "Internal server error",
    errorCode?: string,
  ): AppError {
    return new AppError(message, 500, errorCode);
  }

  /**
   * Create a custom error with specified status code
   * @param message Error message
   * @param statusCode HTTP status code
   * @param errorCode Optional error code
   * @param errors Optional validation errors
   */
  static custom(
    message: string,
    statusCode: number,
    errorCode?: string,
    errors?: any[],
  ): AppError {
    return new AppError(message, statusCode, errorCode, errors);
  }
}

export default AppError;
