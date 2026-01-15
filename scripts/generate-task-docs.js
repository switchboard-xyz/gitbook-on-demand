#!/usr/bin/env node

/**
 * Generate Task Types Documentation from Proto File
 *
 * This script fetches the job_schemas.proto file from the sbv3 repository
 * and generates markdown documentation for all task types.
 */

const fs = require('fs');
const path = require('path');

// Try local file first (for development), then fall back to GitHub
const LOCAL_PROTO_PATH = path.join(__dirname, '..', '..', 'sbv3', 'protos', 'job_schemas.proto');
const PROTO_URL = 'https://raw.githubusercontent.com/switchboard-xyz/sbv3/main/protos/job_schemas.proto';
const OUTPUT_FILE = path.join(__dirname, '..', 'custom-feeds', 'task-types.md');

// Task categorization
const CATEGORIES = {
  'Data Fetching': [
    'HttpTask', 'WebsocketTask', 'SolanaAccountDataFetchTask', 'AnchorFetchTask',
    'SplTokenParseTask', 'SolanaToken2022ExtensionTask'
  ],
  'Parsing': [
    'JsonParseTask', 'RegexExtractTask', 'BufferLayoutParseTask', 'CronParseTask',
    'StringMapTask'
  ],
  'Mathematical Operations': [
    'AddTask', 'SubtractTask', 'MultiplyTask', 'DivideTask', 'PowTask',
    'MaxTask', 'MinTask', 'MeanTask', 'MedianTask', 'RoundTask', 'BoundTask'
  ],
  'DeFi & DEX': [
    'JupiterSwapTask', 'SerumSwapTask', 'MeteoraSwapTask', 'UniswapExchangeRateTask',
    'SushiswapExchangeRateTask', 'PancakeswapExchangeRateTask', 'CurveFinanceTask',
    'LpExchangeRateTask', 'LpTokenPriceTask', 'PumpAmmTask', 'PumpAmmLpTokenPriceTask',
    'TitanTask', 'KuruTask', 'MaceTask', 'HyloTask'
  ],
  'LST & Staking': [
    'SanctumLstPriceTask', 'SplStakePoolTask', 'MarinadeStateTask',
    'LstHistoricalYieldTask', 'VsuiPriceTask', 'SuiLstPriceTask', 'SolayerSusdTask'
  ],
  'Oracle Integration': [
    'OracleTask', 'SwitchboardSurgeTask', 'SurgeTwapTask', 'TwapTask', 'EwmaTask'
  ],
  'Specialized Finance': [
    'LendingRateTask', 'MapleFinanceTask', 'OndoUsdyTask', 'TurboEthRedemptionRateTask',
    'ExponentTask', 'ExponentPTLinearPricingTask', 'PerpMarketTask', 'KalshiApiTask'
  ],
  'Utilities': [
    'ValueTask', 'CacheTask', 'ConditionalTask', 'ComparisonTask', 'SecretsTask',
    'UnixTimeTask', 'SysclockOffsetTask', 'Blake2b128Task'
  ],
  'Protocol-Specific': [
    'XStepPriceTask', 'GlyphTask', 'CorexTask', 'BitFluxTask', 'FragmetricTask',
    'AftermathTask', 'EtherfuseTask'
  ]
};

async function fetchProto() {
  // Try local file first
  if (fs.existsSync(LOCAL_PROTO_PATH)) {
    console.log(`Using local proto file: ${LOCAL_PROTO_PATH}`);
    return fs.readFileSync(LOCAL_PROTO_PATH, 'utf-8');
  }

  // Fall back to GitHub
  console.log(`Fetching from GitHub: ${PROTO_URL}`);
  const response = await fetch(PROTO_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch proto: ${response.status}`);
  }
  return response.text();
}

function parseTaskDocumentation(protoContent) {
  const tasks = new Map();

  // Match block comments followed by message definitions
  // Pattern: /* ... */ followed by message TaskName {
  const taskPattern = /\/\*\s*([\s\S]*?)\s*\*\/\s*message\s+(\w+Task)\s*\{/g;

  let match;
  while ((match = taskPattern.exec(protoContent)) !== null) {
    const [, docComment, taskName] = match;
    tasks.set(taskName, cleanDocumentation(docComment));
  }

  // Also find tasks without block comments (just /// comments or none)
  const simpleTaskPattern = /message\s+(\w+Task)\s*\{/g;
  while ((match = simpleTaskPattern.exec(protoContent)) !== null) {
    const taskName = match[1];
    if (!tasks.has(taskName)) {
      tasks.set(taskName, null);
    }
  }

  return tasks;
}

function cleanDocumentation(doc) {
  if (!doc) return null;

  // Clean up the documentation
  let cleaned = doc
    // Remove leading asterisks from each line (for /* * style comments)
    .replace(/^\s*\*\s?/gm, '')
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .trim();

  return cleaned;
}

function categorizeTask(taskName) {
  for (const [category, tasks] of Object.entries(CATEGORIES)) {
    if (tasks.includes(taskName)) {
      return category;
    }
  }
  return 'Other';
}

function generateMarkdown(tasks) {
  const categorized = {};

  // Categorize all tasks
  for (const [taskName, doc] of tasks) {
    const category = categorizeTask(taskName);
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push({ name: taskName, doc });
  }

  // Generate markdown
  let markdown = `# Task Types

> This documentation is automatically generated from the [job_schemas.proto](https://github.com/switchboard-xyz/sbv3/blob/main/protos/job_schemas.proto) source file.

An **OracleJob** is a collection of tasks that are chained together to arrive at a single numerical value. Tasks execute sequentially, with each task's output feeding into the next.

Some tasks do not consume the running input (such as HttpTask and WebsocketTask), effectively resetting the running result. Others transform the current value through mathematical operations or parsing.

`;

  // Define category order
  const categoryOrder = [
    'Data Fetching',
    'Parsing',
    'Mathematical Operations',
    'DeFi & DEX',
    'LST & Staking',
    'Oracle Integration',
    'Specialized Finance',
    'Utilities',
    'Protocol-Specific',
    'Other'
  ];

  for (const category of categoryOrder) {
    const tasksInCategory = categorized[category];
    if (!tasksInCategory || tasksInCategory.length === 0) continue;

    markdown += `## ${category}\n\n`;

    // Sort tasks alphabetically within category
    tasksInCategory.sort((a, b) => a.name.localeCompare(b.name));

    for (const { name, doc } of tasksInCategory) {
      const camelCaseName = name.charAt(0).toLowerCase() + name.slice(1);
      markdown += `### ${name}\n\n`;

      if (doc) {
        markdown += `${doc}\n\n`;
      } else {
        markdown += `*Documentation pending.*\n\n`;
      }

      markdown += `---\n\n`;
    }
  }

  markdown += `## Next Steps

- [Build with TypeScript](build-and-deploy-feed/build-with-typescript.md) - Create feeds programmatically
- [Build with UI](build-and-deploy-feed/build-with-ui.md) - Use the visual feed builder
- [Advanced Feed Configuration](advanced-feed-configuration/README.md) - Learn about variable overrides and more
`;

  return markdown;
}

async function main() {
  console.log('Fetching proto file...');
  const protoContent = await fetchProto();

  console.log('Parsing task documentation...');
  const tasks = parseTaskDocumentation(protoContent);
  console.log(`Found ${tasks.size} task types`);

  console.log('Generating markdown...');
  const markdown = generateMarkdown(tasks);

  console.log(`Writing to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, markdown);

  console.log('Done!');
}

main().catch(console.error);
