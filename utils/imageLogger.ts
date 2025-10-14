/**
 * Image Logger Utility
 * Enhanced logging for image handling operations with different log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'storage' | 'upload' | 'download' | 'sync' | 'ui' | 'validation';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  error?: Error;
}

class ImageLogger {
  private static instance: ImageLogger;
  private isDebugEnabled: boolean = true;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 1000;

  static getInstance(): ImageLogger {
    if (!ImageLogger.instance) {
      ImageLogger.instance = new ImageLogger();
    }
    return ImageLogger.instance;
  }

  /**
   * Enable or disable debug logging
   */
  setDebugEnabled(enabled: boolean): void {
    this.isDebugEnabled = enabled;
  }

  /**
   * Log a debug message
   */
  debug(category: LogCategory, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  /**
   * Log an info message
   */
  info(category: LogCategory, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  /**
   * Log a warning message
   */
  warn(category: LogCategory, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  /**
   * Log an error message
   */
  error(category: LogCategory, message: string, error?: Error, data?: any): void {
    this.log('error', category, message, data, error);
  }

  /**
   * Private log method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    error?: Error
  ): void {
    if (!this.isDebugEnabled && level === 'debug') {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error,
    };

    // Add to buffer
    this.logBuffer.push(logEntry);
    
    // Trim buffer if it exceeds max size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }

    // Output to console
    this.outputToConsole(logEntry);
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(logEntry: LogEntry): void {
    const { timestamp, level, category, message, data, error } = logEntry;
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data);
        break;
      case 'info':
        console.info(formattedMessage, data);
        break;
      case 'warn':
        console.warn(formattedMessage, data);
        break;
      case 'error':
        console.error(formattedMessage, data, error);
        break;
    }
  }

  /**
   * Get log entries from buffer
   */
  getLogEntries(
    level?: LogLevel,
    category?: LogCategory,
    limit?: number
  ): LogEntry[] {
    let filteredLogs = this.logBuffer;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  /**
   * Log an error with full context
   */
  logError(
    category: LogCategory,
    operation: string,
    error: any,
    context?: any
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    this.error(category, `Error in ${operation}: ${errorMessage}`, error, {
      context,
      stack: errorStack,
    });
  }

  /**
   * Log a network error
   */
  logNetworkError(
    category: LogCategory,
    operation: string,
    url: string,
    status?: number,
    error?: any
  ): void {
    this.error(category, `Network error in ${operation}`, error, {
      url,
      status,
    });
  }

  /**
   * Log a file operation error
   */
  logFileError(
    category: LogCategory,
    operation: string,
    filePath: string,
    error?: any
  ): void {
    this.error(category, `File error in ${operation}`, error, {
      filePath,
    });
  }
}

// Export singleton instance
export const imageLogger = ImageLogger.getInstance();

// Export convenience functions
export const logImageDebug = (category: LogCategory, message: string, data?: any) => 
  imageLogger.debug(category, message, data);

export const logImageInfo = (category: LogCategory, message: string, data?: any) => 
  imageLogger.info(category, message, data);

export const logImageWarn = (category: LogCategory, message: string, data?: any) => 
  imageLogger.warn(category, message, data);

export const logImageError = (category: LogCategory, message: string, error?: Error, data?: any) => 
  imageLogger.error(category, message, error, data);

export const logImageErrorWithContext = (
  category: LogCategory,
  operation: string,
  error: any,
  context?: any
) => imageLogger.logError(category, operation, error, context);