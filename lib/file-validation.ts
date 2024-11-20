export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ALLOWED_FILE_TYPES = {
  pdf: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  word: {
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.doc', '.docx'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  excel: {
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    extensions: ['.xls', '.xlsx'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  text: {
    mimeTypes: ['text/plain'],
    extensions: ['.txt'],
    maxSize: 1 * 1024 * 1024, // 1MB
  },
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  fileType?: keyof typeof ALLOWED_FILE_TYPES
}

export function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    }
  }

  // Check file type
  const fileType = Object.entries(ALLOWED_FILE_TYPES).find(([_, type]) => {
    return (
      type.mimeTypes.includes(file.type) ||
      type.extensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    )
  })

  if (!fileType) {
    return {
      isValid: false,
      error: 'File type not supported',
    }
  }

  // Check specific file type size limit
  if (file.size > fileType[1].maxSize) {
    return {
      isValid: false,
      error: `${fileType[0].toUpperCase()} files must be under ${
        fileType[1].maxSize / 1024 / 1024
      }MB`,
    }
  }

  return {
    isValid: true,
    fileType: fileType[0] as keyof typeof ALLOWED_FILE_TYPES,
  }
}

export function getFileTypeFromName(fileName: string): keyof typeof ALLOWED_FILE_TYPES | undefined {
  const extension = fileName.toLowerCase().split('.').pop()
  
  for (const [type, config] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (config.extensions.some(ext => ext.toLowerCase().includes(extension!))) {
      return type as keyof typeof ALLOWED_FILE_TYPES
    }
  }
  
  return undefined
}
