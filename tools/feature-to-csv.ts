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
  scenarios: ScenarioViewpoint[];
}

interface ParsedStep {
  keyword: string;
  content: string;
}

interface ScenarioViewpoint {
  viewpointId: string;
  scenarioKey: string;
  feature: string;
  featureFile: string;
  sourceRef: string;
  category: string;
  scenario: string;
  precondition: string;
  action: string;
  expectedResult: string;
  changeImpact: string;
  retestRequired: string;
  assignee: string;
  status: string;
  comment: string;
}

function parseFeatureFile(filePath: string): ParseResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const steps: TestStep[] = [];
  const scenarios: ScenarioViewpoint[] = [];
  let currentFeature = '';
  let currentScenario = '';
  let currentScenarioKey = '';
  let currentScenarioLine = 0;
  let currentCategory = '未分類';
  let currentScenarioCategory = '未分類';
  let currentBackgroundSteps: ParsedStep[] = [];
  let currentScenarioSteps: ParsedStep[] = [];
  const usedScenarioKeys = new Set<string>();
  const featureFile = path.basename(filePath);

  function flushScenario() {
    if (!currentFeature || !currentScenario || currentScenario === 'Background (共通前提)') {
      return;
    }

    const viewpointId = `${toFeatureCode(featureFile)}__${currentScenarioKey}`;
    const preconditionParts = [
      ...currentBackgroundSteps
        .filter((step) => step.keyword === 'Given')
        .map((step) => step.content),
      ...currentScenarioSteps
        .filter((step) => step.keyword === 'Given')
        .map((step) => step.content),
    ];
    const actionParts = currentScenarioSteps
      .filter((step) => step.keyword === 'When')
      .map((step) => step.content);
    const expectedParts = currentScenarioSteps
      .filter((step) => step.keyword === 'Then' || step.keyword === 'And' || step.keyword === 'But')
      .map((step) => step.content);

    scenarios.push({
      viewpointId,
      scenarioKey: currentScenarioKey,
      feature: currentFeature,
      featureFile,
      sourceRef: `${featureFile}:${currentScenarioLine}`,
      category: currentScenarioCategory,
      scenario: currentScenario,
      precondition: joinForCell(preconditionParts, '前提なし'),
      action: joinForCell(actionParts, '操作なし'),
      expectedResult: joinForCell(expectedParts, ''),
      changeImpact: '',
      retestRequired: '',
      assignee: '',
      status: '',
      comment: '',
    });
  }

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      if (trimmed.startsWith('# ===') && trimmed.endsWith('==='))
        currentCategory = trimmed.replace(/^# ===\s*/, '').replace(/\s*===$/, '').trim();
      continue;
    }

    // Feature line
    if (trimmed.startsWith('Feature:')) {
      currentFeature = trimmed.replace('Feature:', '').trim();
      continue;
    }

    // Scenario line
    if (trimmed.startsWith('Scenario:')) {
      flushScenario();
      const parsedScenario = parseScenarioLabel(trimmed.replace('Scenario:', '').trim());
      currentScenario = parsedScenario.title;
      currentScenarioKey = parsedScenario.key;
      validateScenarioKey(currentScenarioKey, filePath, index + 1);
      assertUniqueScenarioKey(currentScenarioKey, usedScenarioKeys, filePath, index + 1);
      currentScenarioLine = index + 1;
      currentScenarioCategory = currentCategory;
      currentScenarioSteps = [];
      continue;
    }

    // Background (treat as setup)
    if (trimmed.startsWith('Background:')) {
      flushScenario();
      currentScenario = 'Background (共通前提)';
      currentScenarioKey = '';
      currentBackgroundSteps = [];
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

      const parsedStep = {
        keyword: normalizeStepKeyword(stepMatch[1], currentScenarioSteps),
        content: stepMatch[2],
      };

      if (currentScenario === 'Background (共通前提)') {
        currentBackgroundSteps.push(parsedStep);
      } else {
        currentScenarioSteps.push(parsedStep);
      }
    }
  }

  flushScenario();

  return {
    steps,
    featureName: currentFeature,
    scenarios,
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

function generateScenarioCSV(scenarios: ScenarioViewpoint[]): string {
  const header =
    '観点ID,機能,featureファイル,仕様参照,観点カテゴリ,シナリオ,前提条件,操作,期待結果,変更影響有無,再確認要否,実施者,結果,備考';
  const rows = scenarios.map((scenario) =>
    [
      escapeCSV(scenario.viewpointId),
      escapeCSV(scenario.feature),
      escapeCSV(scenario.featureFile),
      escapeCSV(scenario.sourceRef),
      escapeCSV(scenario.category),
      escapeCSV(scenario.scenario),
      escapeCSV(scenario.precondition),
      escapeCSV(scenario.action),
      escapeCSV(scenario.expectedResult),
      escapeCSV(scenario.changeImpact),
      escapeCSV(scenario.retestRequired),
      escapeCSV(scenario.assignee),
      escapeCSV(scenario.status),
      escapeCSV(scenario.comment),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}

function normalizeStepKeyword(keyword: string, currentScenarioSteps: ParsedStep[]): string {
  if (keyword !== 'And' && keyword !== 'But') {
    return keyword;
  }

  const previousKeyword = currentScenarioSteps.at(-1)?.keyword;
  return previousKeyword ?? 'Then';
}

function joinForCell(parts: string[], fallback: string): string {
  if (parts.length === 0) {
    return fallback;
  }

  return parts.map((part, index) => `${index + 1}. ${part}`).join('\n');
}

function parseScenarioLabel(rawScenario: string): { key: string; title: string } {
  const explicitKeyMatch = rawScenario.match(/^\[(.+?)\]\s+(.+)$/);
  if (explicitKeyMatch) {
    return {
      key: toScenarioKey(explicitKeyMatch[1]),
      title: explicitKeyMatch[2].trim(),
    };
  }

  return {
    key: `TEMP-${toScenarioKey(rawScenario)}`,
    title: rawScenario,
  };
}

function toScenarioKey(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();
}

function validateScenarioKey(key: string, filePath: string, lineNumber: number): void {
  if (key.startsWith('TEMP-')) {
    return;
  }

  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(key)) {
    throw new Error(
      `Invalid scenario key "${key}" at ${path.basename(filePath)}:${lineNumber}. ` +
        'Use uppercase letters, numbers, and hyphens only.'
    );
  }
}

function assertUniqueScenarioKey(
  key: string,
  usedScenarioKeys: Set<string>,
  filePath: string,
  lineNumber: number
): void {
  if (usedScenarioKeys.has(key)) {
    throw new Error(
      `Duplicate scenario key "${key}" at ${path.basename(filePath)}:${lineNumber}. ` +
        'Scenario keys must be unique within a feature file.'
    );
  }

  usedScenarioKeys.add(key);
}

function toFeatureCode(fileName: string): string {
  return fileName.replace(/\.feature$/, '').replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase();
}

function toSafeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '-');
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
  for (const filePath of featureFiles) {
    console.log(`\nParsing: ${path.basename(filePath)}`);
    const result = parseFeatureFile(filePath);
    console.log(`  -> ${result.steps.length} steps extracted`);
    console.log(`  -> ${result.scenarios.length} scenarios extracted`);

    const viewpointOutputPath = path.join(
      outputDir,
      `${toSafeFileName(result.featureName)}-system-test-viewpoints.csv`
    );
    fs.writeFileSync(viewpointOutputPath, generateScenarioCSV(result.scenarios), 'utf-8');
    console.log(`  -> system test viewpoints: ${viewpointOutputPath}`);
  }

  console.log('\nSystem test viewpoint CSVs generated.');

}

main();
