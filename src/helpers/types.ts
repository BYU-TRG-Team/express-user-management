/**
 * Type guard for Error
 */
export const isError = (value: any): value is Error => value instanceof Error;