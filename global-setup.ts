import { rm } from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_DIRS = [
  'allure-results',
  'allure-report',
  'playwright-report',
  'test-results',
];

async function safeRemove(targetPath: string): Promise<void> {
  await rm(targetPath, { recursive: true, force: true });
}

export default async function globalSetup(): Promise<void> {
  if (process.env.PW_CLEAN !== 'false') {
    await Promise.all(ARTIFACT_DIRS.map((dirName) => safeRemove(path.resolve(dirName))));
  }
}
