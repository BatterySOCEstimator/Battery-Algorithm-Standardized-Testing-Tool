export const config = {
  upload: {
    allowedExtensions: ['.py', '.m'] as string[],
    allowedMimetypes: [
      'text/x-python',
      'text/x-python-script',
      'application/x-python-code',
      'text/plain',
      'application/octet-stream',
    ] as string[],
    maxFileSizeMb: 500 as number,
    maxFiles: 10 as number,
    uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  },
};