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

  // Split content into lines for easier processing
  const lines = protoContent.split('\n');

  // Find all message TaskName definitions and their documentation
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const messageMatch = line.match(/^\s*message\s+(\w+Task)\s*\{/);

    if (messageMatch) {
      const taskName = messageMatch[1];

      // Look backwards for documentation (either /* */ block or /// comments)
      let doc = null;
      let fields = [];

      // Check for block comment (/* ... */) before this line
      const textBefore = lines.slice(0, i).join('\n');
      const blockCommentMatch = textBefore.match(/\/\*\s*([\s\S]*?)\s*\*\/\s*$/);

      if (blockCommentMatch) {
        doc = cleanDocumentation(blockCommentMatch[1]);
      } else {
        // Check for /// comments immediately before
        const tripleSlashComments = [];
        let j = i - 1;
        while (j >= 0 && lines[j].trim().startsWith('///')) {
          tripleSlashComments.unshift(lines[j].trim().replace(/^\/\/\/\s?/, ''));
          j--;
        }
        if (tripleSlashComments.length > 0) {
          doc = tripleSlashComments.join('\n');
        }
      }

      // Extract fields from the message body
      fields = extractFields(lines, i);

      tasks.set(taskName, { doc, fields });
    }
  }

  return tasks;
}

function extractFields(lines, messageStartIndex) {
  const fields = [];
  let braceCount = 0;
  let insideMessage = false;
  let nestedDepth = 0;

  for (let i = messageStartIndex; i < lines.length; i++) {
    const line = lines[i];

    // Count braces
    for (const char of line) {
      if (char === '{') {
        braceCount++;
        if (!insideMessage) {
          insideMessage = true;
        } else {
          nestedDepth++;
        }
      } else if (char === '}') {
        braceCount--;
        if (nestedDepth > 0) {
          nestedDepth--;
        }
      }
    }

    // Exit when we close the main message
    if (insideMessage && braceCount === 0) break;

    // Skip if we're inside a nested message/enum/oneof
    if (nestedDepth > 0) continue;

    // Skip nested message/enum/oneof declarations (they open a new brace level)
    if (line.match(/^\s*(message|enum|oneof)\s+\w+/)) {
      continue;
    }

    // Match field definitions: optional/repeated type name = number;
    const fieldMatch = line.match(/^\s*(optional|repeated|required)?\s*(\w+)\s+(\w+)\s*=\s*\d+/);
    if (fieldMatch && insideMessage) {
      const [, , type, name] = fieldMatch;

      // Look for /// comment on the line before
      let description = '';
      const prevLine = lines[i - 1] || '';
      if (prevLine.trim().startsWith('///')) {
        description = prevLine.trim().replace(/^\/\/\/\s?/, '');
      }
      // Also check for inline comment
      const inlineCommentMatch = line.match(/\/\/\s*(.+)$/);
      if (inlineCommentMatch && !description) {
        description = inlineCommentMatch[1];
      }

      fields.push({
        name: name,
        type: type,
        description: description
      });
    }
  }

  return fields;
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
  for (const [taskName, taskData] of tasks) {
    const category = categorizeTask(taskName);
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push({ name: taskName, ...taskData });
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

    for (const { name, doc, fields } of tasksInCategory) {
      markdown += `### ${name}\n\n`;

      if (doc) {
        markdown += `${doc}\n\n`;
      } else {
        markdown += `*No description available.*\n\n`;
      }

      // Add field table if there are documented fields
      if (fields && fields.length > 0) {
        const documentedFields = fields.filter(f => f.description);
        if (documentedFields.length > 0) {
          markdown += `| Field | Type | Description |\n`;
          markdown += `|-------|------|-------------|\n`;
          for (const field of documentedFields) {
            const escapedDesc = field.description.replace(/\|/g, '\\|');
            markdown += `| \`${field.name}\` | ${field.type} | ${escapedDesc} |\n`;
          }
          markdown += `\n`;
        }
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
