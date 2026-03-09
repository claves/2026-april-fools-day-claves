/**
 * Feature to CSV Converter
 *
 * Gherkin形式のFeatureファイルを解析し、CSV形式でテストケースを出力する
 *
 * 出力形式:
 * Feature, Scenario, Step, 内容, 担当, 結果, コメント
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

interface TestStep {
  feature: string;
  scenario: string;
  stepType: string;
  content: string;
  assignee: string;
  result: string;
  comment: string;
}

interface ParseResult {
  steps: TestStep[];
  featureName: string;
}

function parseFeatureFile(filePath: string): ParseResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const steps: TestStep[] = [];
  let currentFeature = '';
  let currentScenario = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      // Extract feature name from comment if it's the language declaration
      if (trimmed.startsWith('# language:')) continue;
      continue;
    }

    // Feature line
    if (trimmed.startsWith('Feature:')) {
      currentFeature = trimmed.replace('Feature:', '').trim();
      continue;
    }

    // Scenario line
    if (trimmed.startsWith('Scenario:')) {
      currentScenario = trimmed.replace('Scenario:', '').trim();
      continue;
    }

    // Background (treat as setup)
    if (trimmed.startsWith('Background:')) {
      currentScenario = 'Background (共通前提)';
      continue;
    }

    // Step lines (Given, When, Then, And, But)
    const stepMatch = trimmed.match(/^(Given|When|Then|And|But)\s+(.+)$/);
    if (stepMatch) {
      steps.push({
        feature: currentFeature,
        scenario: currentScenario,
        stepType: stepMatch[1],
        content: stepMatch[2],
        assignee: '',
        result: '',
        comment: '',
      });
    }
  }

  return {
    steps,
    featureName: currentFeature,
  };
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCSV(allSteps: TestStep[]): string {
  const header = 'Feature,Scenario,Step,内容,担当,結果,コメント';
  const rows = allSteps.map((step) =>
    [
      escapeCSV(step.feature),
      escapeCSV(step.scenario),
      escapeCSV(step.stepType),
      escapeCSV(step.content),
      escapeCSV(step.assignee),
      escapeCSV(step.result),
      escapeCSV(step.comment),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}

function main() {
  const specsDir = path.join(process.cwd(), 'specs');
  const outputDir = path.join(process.cwd(), 'output');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find all .feature files
  const featureFiles = fs
    .readdirSync(specsDir)
    .filter((file) => file.endsWith('.feature'))
    .map((file) => path.join(specsDir, file));

  if (featureFiles.length === 0) {
    console.error('No .feature files found in specs/ directory');
    process.exit(1);
  }

  console.log(`Found ${featureFiles.length} feature file(s):`);
  featureFiles.forEach((f) => console.log(`  - ${path.basename(f)}`));

  // Parse all feature files
  const allSteps: TestStep[] = [];
  for (const filePath of featureFiles) {
    console.log(`\nParsing: ${path.basename(filePath)}`);
    const result = parseFeatureFile(filePath);
    console.log(`  -> ${result.steps.length} steps extracted`);
    allSteps.push(...result.steps);
  }

  // Generate CSV
  const csv = generateCSV(allSteps);
  const outputPath = path.join(outputDir, 'test-cases.csv');
  fs.writeFileSync(outputPath, csv, 'utf-8');

  console.log(`\nCSV generated: ${outputPath}`);
  console.log(`Total steps: ${allSteps.length}`);

  // Also generate individual CSVs per feature
  const featureGroups = new Map<string, TestStep[]>();
  for (const step of allSteps) {
    if (!featureGroups.has(step.feature)) {
      featureGroups.set(step.feature, []);
    }
    featureGroups.get(step.feature)!.push(step);
  }

  console.log('\nPer-feature CSVs:');
  for (const [feature, steps] of featureGroups) {
    const safeName = feature.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '-');
    const featureOutputPath = path.join(outputDir, `${safeName}.csv`);
    fs.writeFileSync(featureOutputPath, generateCSV(steps), 'utf-8');
    console.log(`  - ${featureOutputPath} (${steps.length} steps)`);
  }
}

main();
