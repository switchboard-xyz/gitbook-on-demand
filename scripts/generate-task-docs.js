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
  if (fs.existsSync(LOCAL_PROTO_PATH)) {
    console.log(`Using local proto file: ${LOCAL_PROTO_PATH}`);
    return fs.readFileSync(LOCAL_PROTO_PATH, 'utf-8');
  }

  console.log(`Fetching from GitHub: ${PROTO_URL}`);
  const response = await fetch(PROTO_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch proto: ${response.status}`);
  }
  return response.text();
}

function countBraces(line) {
  let count = 0;
  for (const char of line) {
    if (char === '{') count++;
    if (char === '}') count--;
  }
  return count;
}

function findBlockEnd(lines, startIndex) {
  let depth = 0;
  let started = false;

  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].includes('{')) started = true;
    const delta = countBraces(lines[i]);
    depth += delta;

    if (started && depth === 0) return i;
  }

  throw new Error(`Unclosed proto block starting on line ${startIndex + 1}`);
}

function collectFieldDescription(lines, fieldIndex) {
  const comments = [];
  let i = fieldIndex - 1;

  while (i >= 0 && lines[i].trim().startsWith('///')) {
    comments.unshift(lines[i].trim().replace(/^\/\/\/\s?/, ''));
    i--;
  }

  if (comments.length > 0) {
    return collapseTableProse(comments.join('\n'));
  }

  const inlineComment = lines[fieldIndex].match(/\/\/\s*(.+)$/);
  return inlineComment ? collapseTableProse(inlineComment[1]) : '';
}

function collapseTableProse(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseField(lines, fieldIndex) {
  const fieldMatch = lines[fieldIndex].match(
    /^\s*(?:optional|repeated|required)?\s*([.\w]+)\s+(\w+)\s*=\s*\d+/
  );
  if (!fieldMatch) return null;

  return {
    type: fieldMatch[1],
    name: fieldMatch[2],
    description: collectFieldDescription(lines, fieldIndex)
  };
}

function extractFieldsFromRange(lines, startIndex, endIndex) {
  const fields = [];

  for (let i = startIndex; i < endIndex; i++) {
    const declaration = lines[i].match(/^\s*(message|enum|oneof)\s+\w+\s*\{/);
    if (declaration) {
      const blockEnd = findBlockEnd(lines, i);
      if (declaration[1] === 'oneof') {
        fields.push(...extractFieldsFromRange(lines, i + 1, blockEnd));
      }
      i = blockEnd;
      continue;
    }

    const field = parseField(lines, i);
    if (field) fields.push(field);
  }

  return fields;
}

function parseMessageDefinition(lines, messageStartIndex) {
  const messageMatch = lines[messageStartIndex].match(/^\s*message\s+(\w+)\s*\{/);
  if (!messageMatch) {
    throw new Error(`Expected message declaration on line ${messageStartIndex + 1}`);
  }

  const endIndex = findBlockEnd(lines, messageStartIndex);
  const fields = [];
  const nestedMessages = new Map();

  for (let i = messageStartIndex + 1; i < endIndex; i++) {
    const declaration = lines[i].match(/^\s*(message|enum|oneof)\s+(\w+)\s*\{/);
    if (declaration) {
      const blockEnd = findBlockEnd(lines, i);
      if (declaration[1] === 'message') {
        nestedMessages.set(declaration[2], {
          fields: extractFieldsFromRange(lines, i + 1, blockEnd)
        });
      } else if (declaration[1] === 'oneof') {
        fields.push(...extractFieldsFromRange(lines, i + 1, blockEnd));
      }
      i = blockEnd;
      continue;
    }

    const field = parseField(lines, i);
    if (field) fields.push(field);
  }

  const referencedTypes = new Set(fields.map(field => field.type));
  const referencedNestedMessages = new Map(
    [...nestedMessages].filter(([name]) => referencedTypes.has(name))
  );

  return {
    name: messageMatch[1],
    endIndex,
    fields,
    nestedMessages: referencedNestedMessages
  };
}

function extractTaskDocumentation(lines, messageStartIndex) {
  let i = messageStartIndex - 1;
  while (i >= 0 && lines[i].trim() === '') i--;

  if (i >= 0 && lines[i].trim().endsWith('*/')) {
    const commentEnd = i;
    while (i >= 0 && !lines[i].includes('/*')) i--;
    if (i >= 0) {
      const commentText = lines.slice(i, commentEnd + 1).join('\n');
      const match = commentText.match(/\/\*\s*([\s\S]*?)\s*\*\//);
      return match ? cleanDocumentation(match[1]) : null;
    }
  }

  if (i >= 0 && lines[i].trim().startsWith('///')) {
    const comments = [];
    while (i >= 0 && lines[i].trim().startsWith('///')) {
      comments.unshift(lines[i].trim().replace(/^\/\/\/\s?/, ''));
      i--;
    }
    return comments.join('\n');
  }

  return null;
}

function parseTaskDocumentation(protoContent) {
  const tasks = new Map();
  const lines = protoContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const messageMatch = lines[i].match(/^\s*message\s+(\w+Task)\s*\{/);
    if (!messageMatch) continue;

    const message = parseMessageDefinition(lines, i);
    tasks.set(message.name, {
      doc: extractTaskDocumentation(lines, i),
      fields: message.fields,
      nestedMessages: message.nestedMessages
    });
    i = message.endIndex;
  }

  return tasks;
}

function extractFields(lines, messageStartIndex) {
  return parseMessageDefinition(lines, messageStartIndex).fields;
}

function cleanDocumentation(doc) {
  if (!doc) return null;

  let cleaned = doc
    .replace(/^\s*\*(?!\*)\s?/gm, '')
    .replace(/\r\n/g, '\n')
    .trim();

  cleaned = formatJsonCodeBlocks(cleaned);
  cleaned = demoteInternalHeadings(cleaned);

  return cleaned;
}

function formatJsonCodeBlocks(text) {
  return text.replace(/```json\s*([\s\S]*?)```/g, (match, jsonContent) => {
    const trimmed = jsonContent.trim();
    try {
      const parsed = JSON.parse(trimmed);
      const formatted = JSON.stringify(parsed, null, 2);
      return '```json\n' + formatted + '\n```';
    } catch {
      return match;
    }
  });
}

function demoteInternalHeadings(text) {
  return text.replace(/^(#{2,6})\s+(.+)$/gm, (_, __, headingText) => {
    return `**${headingText.trim()}**`;
  });
}

function categorizeTask(taskName) {
  for (const [category, tasks] of Object.entries(CATEGORIES)) {
    if (tasks.includes(taskName)) return category;
  }
  return 'Other';
}

function renderFieldTable(fields) {
  const documentedFields = fields.filter(field => field.description);
  if (documentedFields.length === 0) return '';

  let markdown = '| Field | Type | Description |\n';
  markdown += '|-------|------|-------------|\n';
  for (const field of documentedFields) {
    const description = collapseTableProse(field.description).replace(/\|/g, '\\|');
    markdown += `| \`${field.name}\` | ${field.type} | ${description} |\n`;
  }
  return `${markdown}\n`;
}

function generateMarkdown(tasks) {
  const categorized = {};

  for (const [taskName, taskData] of tasks) {
    const category = categorizeTask(taskName);
    if (!categorized[category]) categorized[category] = [];
    categorized[category].push({ name: taskName, ...taskData });
  }

  let markdown = `# Task Types

> This documentation is automatically generated from the [job_schemas.proto](https://github.com/switchboard-xyz/sbv3/blob/main/protos/job_schemas.proto) source file.

An **OracleJob** is a collection of tasks that are chained together to arrive at a single numerical value. Tasks execute sequentially, with each task's output feeding into the next.

Some tasks do not consume the running input (such as HttpTask and WebsocketTask), effectively resetting the running result. Others transform the current value through mathematical operations or parsing.

`;

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
    tasksInCategory.sort((a, b) => a.name.localeCompare(b.name));

    for (const { name, doc, fields, nestedMessages } of tasksInCategory) {
      markdown += `### ${name}\n\n`;
      markdown += doc ? `${doc}\n\n` : '*No description available.*\n\n';
      markdown += renderFieldTable(fields || []);

      if (nestedMessages) {
        for (const [nestedName, nestedMessage] of nestedMessages) {
          const table = renderFieldTable(nestedMessage.fields || []);
          if (table) markdown += `**${nestedName} fields**\n\n${table}`;
        }
      }

      markdown += '---\n\n';
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

module.exports = {
  collapseTableProse,
  extractFields,
  fetchProto,
  generateMarkdown,
  main,
  parseTaskDocumentation,
  renderFieldTable
};

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
