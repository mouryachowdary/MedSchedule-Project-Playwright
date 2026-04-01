const { access, rm } = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const allureResultsDir = path.join(projectRoot, 'allure-results');
const allureReportDir = path.join(projectRoot, 'allure-report');
const allureResultsHistoryDir = path.join(allureResultsDir, 'history');

async function removeDirectory(targetPath) {
  await rm(targetPath, { recursive: true, force: true });
}

async function ensureResultsExist() {
  try {
    await access(allureResultsDir);
  } catch {
    throw new Error(
      'No allure-results directory was found. Run Playwright tests first so Allure has fresh results to generate.'
    );
  }
}

function runCommand(commandLine) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(commandLine, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    childProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${commandLine} failed with exit code ${code ?? 'unknown'}`));
    });

    childProcess.on('error', reject);
  });
}

async function resetAllureArtifacts() {
  await Promise.all([removeDirectory(allureResultsDir), removeDirectory(allureReportDir)]);
}

async function generateReport() {
  await ensureResultsExist();
  await removeDirectory(allureResultsHistoryDir);
  await removeDirectory(allureReportDir);
  await runCommand('npx allure generate allure-results --clean -o allure-report');
}

async function openReport() {
  await generateReport();
  await runCommand('npx allure open allure-report');
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'reset':
      await resetAllureArtifacts();
      return;
    case 'generate':
      await generateReport();
      return;
    case 'open':
      await openReport();
      return;
    default:
      throw new Error('Unsupported command. Use one of: reset, generate, open');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});