/**
 * Logger service for STABLE-FUNDS
 * 
 * This service handles logging operations and errors in a way that doesn't disrupt the user experience.
 * It can be configured to send logs to a server, local storage, or console based on the environment.
 */

// Log level enum
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Log entry interface
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  transactionId?: string;
}

// Configure where logs should be sent based on environment
const shouldSendToServer = process.env.NODE_ENV === 'production';
const shouldStoreLocally = true; // Always store locally for debug purposes
const maxLocalStorageLogs = 100; // Limit local storage to prevent overflow

// Main logger class
class Logger {
  private localStorageKey = 'stablefunds-logs';
  private endpoint = process.env.REACT_APP_LOG_ENDPOINT || 'https://api.stablefunds.io/logs';
  
  // Log a message with specified level and category
  log(level: LogLevel, category: string, message: string, data?: any, userId?: string, transactionId?: string): void {
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      userId,
      transactionId
    };
    
    // Always log to console in development
    this.logToConsole(logEntry);
    
    // Store in local storage if configured
    if (shouldStoreLocally) {
      this.storeLocally(logEntry);
    }
    
    // Send to server in production
    if (shouldSendToServer) {
      this.sendToServer(logEntry);
    }
  }
  
  // Convenience methods for different log levels
  debug(category: string, message: string, data?: any, userId?: string, transactionId?: string): void {
    this.log(LogLevel.DEBUG, category, message, data, userId, transactionId);
  }
  
  info(category: string, message: string, data?: any, userId?: string, transactionId?: string): void {
    this.log(LogLevel.INFO, category, message, data, userId, transactionId);
  }
  
  warning(category: string, message: string, data?: any, userId?: string, transactionId?: string): void {
    this.log(LogLevel.WARNING, category, message, data, userId, transactionId);
  }
  
  error(category: string, message: string, data?: any, userId?: string, transactionId?: string): void {
    this.log(LogLevel.ERROR, category, message, data, userId, transactionId);
  }
  
  critical(category: string, message: string, data?: any, userId?: string, transactionId?: string): void {
    this.log(LogLevel.CRITICAL, category, message, data, userId, transactionId);
  }
  
  // Specialized method for logging stablecoin operations
  stablecoinOperation(operation: string, success: boolean, data: any, errorDetails?: any): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = success 
      ? `Stablecoin ${operation} completed successfully` 
      : `Stablecoin ${operation} failed`;
    
    this.log(level, 'STABLECOIN', message, {
      ...data,
      success,
      errorDetails
    });
  }
  
  // Log to browser console
  private logToConsole(logEntry: LogEntry): void {
    const formattedTime = new Date(logEntry.timestamp).toISOString();
    const prefix = `[${formattedTime}] [${logEntry.level.toUpperCase()}] [${logEntry.category}]`;
    
    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, logEntry.message, logEntry.data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, logEntry.message, logEntry.data || '');
        break;
      case LogLevel.WARNING:
        console.warn(prefix, logEntry.message, logEntry.data || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(prefix, logEntry.message, logEntry.data || '');
        break;
    }
  }
  
  // Store logs in local storage
  private storeLocally(logEntry: LogEntry): void {
    try {
      // Get existing logs
      const existingLogsJson = localStorage.getItem(this.localStorageKey) || '[]';
      const existingLogs: LogEntry[] = JSON.parse(existingLogsJson);
      
      // Add new log entry
      existingLogs.push(logEntry);
      
      // Trim if exceeding max count
      const trimmedLogs = existingLogs.slice(-maxLocalStorageLogs);
      
      // Save back to local storage
      localStorage.setItem(this.localStorageKey, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Failed to store log in local storage:', error);
    }
  }
  
  // Send logs to server
  private sendToServer(logEntry: LogEntry): void {
    // Use background fetch to avoid blocking UI
    // This will silently fail if the request fails, which is fine for logging
    try {
      fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry),
        keepalive: true // Ensure delivery even if page is closing
      }).catch(err => {
        // Just log the error locally, don't throw
        console.error('Failed to send log to server:', err);
      });
    } catch (error) {
      // Just log locally and continue
      console.error('Error preparing log for server:', error);
    }
  }
  
  getAllLocalLogs(): LogEntry[] {
    try {
      const logsJson = localStorage.getItem(this.localStorageKey) || '[]';
      return JSON.parse(logsJson);
    } catch (error) {
      console.error('Failed to retrieve logs from local storage:', error);
      return [];
    }
  }
  
  // Clear local logs
  clearLocalLogs(): void {
    try {
      localStorage.removeItem(this.localStorageKey);
    } catch (error) {
      console.error('Failed to clear logs from local storage:', error);
    }
  }
}

// Export a singleton instance
export const logger = new Logger(); 