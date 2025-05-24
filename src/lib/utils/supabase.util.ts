interface SupabaseError {
  code: string | null
  details: string | null
  hint: string | null
  message: string | null
}

export const isSupabaseError = (error: unknown): error is SupabaseError => {
  return typeof error === 'object' && error !== null && 'code' in error && 'details' in error && 'hint' in error && 'message' in error
}

export const SupabaseErrorCodes = {
  ResourceAlreadyExists: '23505',
}
