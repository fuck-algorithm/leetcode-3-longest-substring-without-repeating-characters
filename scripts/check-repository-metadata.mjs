import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const repoUrl = packageJson.repository?.url;
const match = typeof repoUrl === 'string'
  ? repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/)
  : null;

if (!match) {
  console.error('[FAIL] package.json repository.url must be a GitHub repository URL');
  process.exit(1);
}

const repo = `${match[1]}/${match[2]}`;
let metadata;
try {
  const output = execFileSync('gh', [
    'repo', 'view', repo,
    '--json', 'description,repositoryTopics,homepageUrl'
  ], { encoding: 'utf8' });
  metadata = JSON.parse(output);
} catch (error) {
  console.error(`[FAIL] Unable to read GitHub repository metadata for ${repo}. Check gh auth status.`);
  console.error(error.stderr?.toString().trim() || error.message);
  process.exit(1);
}

const failures = [];
const description = metadata.description ?? '';
const topics = new Set((metadata.repositoryTopics ?? []).map((topic) => topic.name));
const expectedHomepage = `https://${match[1]}.github.io/${match[2]}/`;

if (!/leetcode/i.test(description) || !/algorithm visualization/i.test(description)) {
  failures.push('description must be English and identify this as a LeetCode algorithm visualization');
}
for (const topic of ['leetcode', 'algorithm-visualization']) {
  if (!topics.has(topic)) failures.push(`missing required topic: ${topic}`);
}
if (!metadata.homepageUrl || new URL(metadata.homepageUrl).href !== expectedHomepage) {
  failures.push(`homepageUrl must be ${expectedHomepage}`);
}

console.log(JSON.stringify(metadata, null, 2));
if (failures.length) {
  failures.forEach((failure) => console.error(`[FAIL] ${failure}`));
  process.exit(1);
}
console.log('[PASS] GitHub repository metadata is valid');
