// This file can be used to easily set/modify global variables, like file upload restrictions, server settings, etc.

export const config = {
  upload: {
    // Extensions allowed for the top-level upload: a single .zip, or one-or-more loose files.
    allowedExtensions: ['.py', '.zip', '.xlsx'] as string[],
    // Extensions allowed for files inside a .zip.
    allowedZipContentExtensions: ['.py', '.md', '.xlsx'] as string[],
    maxFileSizeMb: 100 as number,
    // Loose files get a stricter size cap since they're zipped in memory server-side.
    maxLooseFileSizeMb: 10 as number,
    maxFiles: 10 as number,
    uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  },
};