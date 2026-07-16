const assert = require('node:assert/strict');
const test = require('node:test');

const {
  generateMarkdown,
  parseTaskDocumentation
} = require('./generate-task-docs');

const PROTO_FIXTURE = [
  'message OracleJob {',
  '  /* Jupiter docs. */',
  '  message JupiterSwapTask {',
  '    /// The input token address.',
  '    optional string in_token_address = 1;',
  '    /// Optional Jupiter API key.',
  '    ///',
  '    /// Set this field to `${JUPITER_API_KEY}` and provide the matching non-empty value',
  '    /// through variableOverrides when requesting the feed.',
  '    /// An unresolved placeholder fails before contacting Jupiter.',
  '    /// If this field is omitted or empty, the oracle configured key is used when available.',
  '    optional string api_key = 12;',
  '  }',
  '',
  '  /* Oracle docs. */',
  '  message OracleTask {',
  '    message PythConfigs {',
  '      /// Optional Hermes base URL used by pyth_address tasks.',
  '      optional string hermes_url = 1;',
  '      /// Preferred Pyth confidence interval setting, expressed as a raw percentage.',
  '      /// For example, use 10 to represent 10%, not 0.1.',
  '      optional double pyth_allowed_confidence_interval = 2;',
  '      /// Maximum accepted price age in seconds.',
  '      /// Defaults to 15 seconds for pyth_address and 75 seconds for pyth_push_feed_id.',
  '      optional int32 max_stale_seconds = 3;',
  '      /// Pyth push-feed shard used only by pyth_push_feed_id. Defaults to shard 0.',
  '      optional uint32 push_feed_shard_id = 4;',
  '      /// Optional API key for authenticated Pyth Hermes requests made by pyth_address tasks.',
  '      /// Use a variable placeholder such as `${PYTH_API_KEY}` and supply a matching non-empty variableOverrides value at execution time; do not hardcode credentials.',
  '      /// This field takes precedence when it is non-empty. If it is omitted or empty, variableOverrides.PYTH_API_KEY is accepted as a compatibility fallback.',
  '      /// That fallback is request-wide: the same value is used by every pyth_address task in the execution that does not configure its own api_key.',
  '      /// Pyth push-feed tasks read on-chain accounts and do not use this API key.',
  '      optional string api_key = 5;',
  '    }',
  '    oneof AggregatorAddress {',
  '      /// Mainnet address for a Pyth feed.',
  '      string pyth_address = 2;',
  '      /// Pyth price feed ID for an upgraded Solana push feed.',
  '      string pyth_push_feed_id = 12;',
  '    }',
  '    /// Optional settings for Pyth tasks.',
  '    optional PythConfigs pyth_configs = 6;',
  '  }',
  '',
  '  message EmptyTask {}',
  '',
  '  /* Value docs. */',
  '  message ValueTask {',
  '    message ValueConfig {',
  '      /// This comment belongs only to ValueConfig.',
  '      optional string value = 1;',
  '    }',
  '    /// Value-specific settings.',
  '    optional ValueConfig config = 1;',
  '  }',
  '}'
].join('\n');

test('retains Jupiter multiline API key documentation', () => {
  const tasks = parseTaskDocumentation(PROTO_FIXTURE);
  const apiKey = tasks.get('JupiterSwapTask').fields.find(field => field.name === 'api_key');

  assert.equal(
    apiKey.description,
    'Optional Jupiter API key. Set this field to `${JUPITER_API_KEY}` and provide the matching non-empty value through variableOverrides when requesting the feed. An unresolved placeholder fails before contacting Jupiter. If this field is omitted or empty, the oracle configured key is used when available.'
  );
});

test('includes OracleTask Pyth fields declared in a oneof', () => {
  const tasks = parseTaskDocumentation(PROTO_FIXTURE);
  const fieldNames = tasks.get('OracleTask').fields.map(field => field.name);

  assert.ok(fieldNames.includes('pyth_address'));
  assert.ok(fieldNames.includes('pyth_push_feed_id'));
});

test('parses tasks after a single-line empty message', () => {
  const tasks = parseTaskDocumentation(PROTO_FIXTURE);

  assert.ok(tasks.has('EmptyTask'));
  assert.ok(tasks.has('ValueTask'));
});

test('renders every documented PythConfigs field and the complete fallback behavior', () => {
  const tasks = parseTaskDocumentation(PROTO_FIXTURE);
  const pythConfigs = tasks.get('OracleTask').nestedMessages.get('PythConfigs');
  const markdown = generateMarkdown(tasks);

  assert.deepEqual(
    pythConfigs.fields.map(field => field.name),
    [
      'hermes_url',
      'pyth_allowed_confidence_interval',
      'max_stale_seconds',
      'push_feed_shard_id',
      'api_key'
    ]
  );
  assert.match(markdown, /\*\*PythConfigs fields\*\*/);
  assert.match(markdown, /compatibility fallback/);
  assert.match(markdown, /same value is used by every pyth_address task/);
  assert.match(markdown, /Pyth push-feed tasks read on-chain accounts and do not use this API key/);
});

test('keeps nested comments with their owning message', () => {
  const tasks = parseTaskDocumentation(PROTO_FIXTURE);
  const oracleMarkdown = generateMarkdown(new Map([['OracleTask', tasks.get('OracleTask')]]));
  const valueMarkdown = generateMarkdown(new Map([['ValueTask', tasks.get('ValueTask')]]));

  assert.doesNotMatch(oracleMarkdown, /belongs only to ValueConfig/);
  assert.match(valueMarkdown, /belongs only to ValueConfig/);
});

test('generates deterministic output', () => {
  const first = generateMarkdown(parseTaskDocumentation(PROTO_FIXTURE));
  const second = generateMarkdown(parseTaskDocumentation(PROTO_FIXTURE));

  assert.equal(second, first);
});
