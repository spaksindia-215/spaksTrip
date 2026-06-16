import { Logger } from "./logger";

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  logger: Logger,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;
  let delay = options.delayMs;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      logger.debug(
        `${operationName}: Attempt ${attempt}/${options.maxAttempts}`
      );
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `${operationName}: Attempt ${attempt} failed: ${lastError.message}`
      );

      if (attempt < options.maxAttempts) {
        logger.debug(`${operationName}: Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Increase delay for next attempt (optional exponential backoff)
        if (options.backoffMultiplier) {
          delay = Math.min(
            delay * options.backoffMultiplier,
            options.delayMs * 10 // Cap at 10x initial delay
          );
        }
      }
    }
  }

  throw lastError || new Error(`${operationName}: Failed after all retries`);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
