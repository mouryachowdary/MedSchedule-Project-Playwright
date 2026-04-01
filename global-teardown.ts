import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const RESULT_DIR = 'allure-results';
const REPORT_DIR = 'allure-report';

async function runCommand(commandLine: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(commandLine, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${commandLine} failed with exit code ${code ?? 'unknown'}`));
    });

    child.on('error', reject);
  });
}

export default async function globalTeardown(): Promise<void> {
  // Generate a fresh Allure report after each run by default.
  if (process.env.AUTO_ALLURE_REPORT === 'false') {
    return;
  }

  try {
    await access(RESULT_DIR);
  } catch {
    return;
  }

  try {
    await runCommand(`npx allure generate ${RESULT_DIR} --clean -o ${REPORT_DIR}`);
  } catch (error) {
    console.warn(
      '[allure] Automatic report generation failed. You can retry with: npx allure generate allure-results --clean -o allure-report\n',
      error
    );
  }
}