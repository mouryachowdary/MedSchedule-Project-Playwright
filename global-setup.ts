import { rm } from 'node:fs/promises';
import path from 'node:path';

const ALWAYS_CLEAN_ARTIFACT_DIRS = ['allure-results', 'allure-report'];
const OPTIONAL_CLEAN_ARTIFACT_DIRS = ['playwright-report', 'test-results'];

async function safeRemove(targetPath: string): Promise<void> {
  await rm(targetPath, { recursive: true, force: true });
}

export default async function globalSetup(): Promise<void> {
  // Keep Allure output deterministic for every run, even when PW_CLEAN=false.
  await Promise.all(ALWAYS_CLEAN_ARTIFACT_DIRS.map((dirName) => safeRemove(path.resolve(dirName))));

  if (process.env.PW_CLEAN !== 'false') {
    await Promise.all(OPTIONAL_CLEAN_ARTIFACT_DIRS.map((dirName) => safeRemove(path.resolve(dirName))));
  }
}
