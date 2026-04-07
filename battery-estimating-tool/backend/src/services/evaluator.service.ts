import { spawn } from 'child_process';
import { logger } from '@/services/logger.service';
import path from 'path';

interface EvaluationResult {
  error: boolean;
  message?: string;
  results_path?: string;
  Weighted_Error?: number;
  Test_Scores?: number[];
  All_Drive_Cycles_Average_RMSE?: number;
  All_Drive_Cycles_Average_MAE?: number;
  All_Drive_Cycles_Average_MAXE?: number;
  Complexity?: number;
}

/**
 * Runs the Python evaluation inside a sandboxed Docker container.
 *
 * The evaluator image (socapp-evaluator) is pre-built and expects:
 *   - The uploads directory mounted at /uploads
 *   - CLI argument: path to the model dir inside the container
 *   - stdout: JSON result
 *   - stderr: diagnostic logs
 */
export function runEvaluatorContainer(modelDir: string, parallelizationLevel: string): Promise<EvaluationResult> {
  return new Promise((resolve, reject) => {
    const imageName = process.env.EVALUATOR_IMAGE ?? 'socapp-evaluator';
    const uploadDir = process.env.UPLOAD_DIR ?? './uploads';

    // Resolve to absolute paths
    const absoluteModelDir = path.resolve(modelDir);
    const absoluteUploadDir = path.resolve(uploadDir);

    // Container sees uploads mounted at /uploads
    // Pass the relative path within as the argument
    const relativePath = path.relative(absoluteUploadDir, absoluteModelDir);
    const containerModelPath = `/uploads/${relativePath}`;

    const args = [
      'run',
      '--rm',                                        // Remove container when done
      '--network', 'bridge',                         
      '--memory', '2g',                              // Memory limit
      '--cpus', '2',                                 // CPU limit
      '--pids-limit', '100',                         // Process limit
      '--read-only',                                 // Read-only root filesystem
      '--tmpfs', '/tmp:size=512m', 
      '--tmpfs', '/root/.coiled:size=128m',    
      '-e', 'MPLCONFIGDIR=/tmp/matplotlib',                   // Writable tmp
      '-v', `${absoluteUploadDir}:/uploads`,         // Mount uploads directory
      imageName,
      containerModelPath,                            // Argument to entrypoint
      parallelizationLevel                           // Level of parallelization
    ];

    logger.info('evaluator/docker - Spawning container', {
      image: imageName,
      modelDir: containerModelPath,
    });

    const proc = spawn('docker', args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      logger.debug('evaluator/docker - stderr', { data: data.toString().trim() });
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        logger.error('evaluator/docker - Container exited with non-zero code', {
          code, stderr, stdout,
        });
        resolve({ error: true, message: `Evaluator exited with code ${code}: ${stderr}` });
        return;
      }

      try {
        const result: EvaluationResult = JSON.parse(stdout.trim());
        resolve(result);
      } catch {
        logger.error('evaluator/docker - Failed to parse stdout as JSON', { stdout });
        resolve({ error: true, message: 'Failed to parse evaluator output' });
      }
    });

    proc.on('error', (err) => {
      logger.error('evaluator/docker - Failed to spawn docker', { err });
      reject(err);
    });
  });
}
