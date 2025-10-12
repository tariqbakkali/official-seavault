/**
 * Performance monitoring utility for sync operations
 */

export interface SyncPerformanceMetrics {
  operation: string;
  duration: number; // in milliseconds
  recordsProcessed: number;
  dataSize: number; // in bytes
  timestamp: number;
  success: boolean;
  error?: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: SyncPerformanceMetrics[] = [];
  private startTime: number = 0;
  private currentOperation: string = '';
  private recordsProcessed: number = 0;
  private dataSize: number = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start monitoring a sync operation
   * @param operation The name of the operation
   */
  startOperation(operation: string): void {
    this.startTime = Date.now();
    this.currentOperation = operation;
    this.recordsProcessed = 0;
    this.dataSize = 0;
  }

  /**
   * Record the number of records processed
   * @param count The number of records processed
   */
  addRecordsProcessed(count: number): void {
    this.recordsProcessed += count;
  }

  /**
   * Record the size of data processed
   * @param size The size of data in bytes
   */
  addDataSize(size: number): void {
    this.dataSize += size;
  }

  /**
   * End monitoring a sync operation
   * @param success Whether the operation was successful
   * @param error Error message if the operation failed
   */
  endOperation(success: boolean, error?: string): void {
    if (this.startTime === 0) return;

    const duration = Date.now() - this.startTime;
    
    const metric: SyncPerformanceMetrics = {
      operation: this.currentOperation,
      duration,
      recordsProcessed: this.recordsProcessed,
      dataSize: this.dataSize,
      timestamp: this.startTime,
      success
    };

    if (error) {
      metric.error = error;
    }

    this.metrics.push(metric);
    
    // Reset for next operation
    this.startTime = 0;
    this.currentOperation = '';
    this.recordsProcessed = 0;
    this.dataSize = 0;
  }

  /**
   * Get all performance metrics
   * @returns Array of performance metrics
   */
  getMetrics(): SyncPerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get average performance metrics for an operation
   * @param operation The operation to get metrics for
   * @returns Average performance metrics
   */
  getAverageMetrics(operation: string): SyncPerformanceMetrics | null {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    
    if (operationMetrics.length === 0) return null;
    
    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    const totalRecords = operationMetrics.reduce((sum, m) => sum + m.recordsProcessed, 0);
    const totalDataSize = operationMetrics.reduce((sum, m) => sum + m.dataSize, 0);
    const successfulOperations = operationMetrics.filter(m => m.success).length;
    
    return {
      operation,
      duration: totalDuration / operationMetrics.length,
      recordsProcessed: totalRecords / operationMetrics.length,
      dataSize: totalDataSize / operationMetrics.length,
      timestamp: Date.now(),
      success: successfulOperations === operationMetrics.length
    };
  }

  /**
   * Get recent performance metrics
   * @param limit The number of recent metrics to return
   * @returns Array of recent performance metrics
   */
  getRecentMetrics(limit: number = 10): SyncPerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear all performance metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Log performance metrics to console
   */
  logMetrics(): void {
  }

  /**
   * Get performance summary
   * @returns Performance summary
   */
  getSummary(): any {
    const totalOperations = this.metrics.length;
    const successfulOperations = this.metrics.filter(m => m.success).length;
    const failedOperations = totalOperations - successfulOperations;
    
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalRecords = this.metrics.reduce((sum, m) => sum + m.recordsProcessed, 0);
    const totalDataSize = this.metrics.reduce((sum, m) => sum + m.dataSize, 0);
    
    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
      totalDuration,
      averageDuration: totalOperations > 0 ? totalDuration / totalOperations : 0,
      totalRecords,
      averageRecordsPerOperation: totalOperations > 0 ? totalRecords / totalOperations : 0,
      totalDataSize,
      averageDataSizePerOperation: totalOperations > 0 ? totalDataSize / totalOperations : 0
    };
  }
}