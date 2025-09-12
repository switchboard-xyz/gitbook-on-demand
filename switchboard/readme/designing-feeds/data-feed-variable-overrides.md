---
description: Using variable overrides in data feeds for dynamic configuration and secure API integration
---

# Data Feed Variable Overrides

Variable overrides provide a powerful mechanism for dynamically configuring oracle jobs without hardcoding sensitive information like API keys or frequently changing parameters. This feature enables secure, flexible data feed configuration for both testing and production environments.

## What are Variable Overrides?

Variable overrides allow you to inject values into oracle job definitions at runtime using the `${VARIABLE_NAME}` syntax.

## ⚠️ Security Warning: Variables Are Not Verifiable

**IMPORTANT**: Variable overrides are **not part of the cryptographic verification process**. The oracle signatures only verify the job structure, not the variable values injected at runtime. This means:

- **Variables can be manipulated** by whoever controls the execution environment
- **Feed consumers cannot verify** what variable values were used
- **Use variables ONLY for authentication** - API keys and authentication tokens
- **Never use variables for anything else** - URLs, paths, parameters, calculations, or data selection logic

### Safe Uses ✅
- API keys: `${API_KEY}`
- Authentication tokens: `${AUTH_TOKEN}`

### Dangerous Uses ❌
- Base URLs: `${BASE_URL}` (changes data source)
- API versions: `${API_VERSION}` (could return different data formats)
- Price multipliers: `${MULTIPLIER}` (affects calculations)
- JSON paths: `${JSON_PATH}` (changes what data is extracted)
- Any parameter that affects data traversal, extraction, or calculation

## Primary Use Case: Secure Credential Management

The main purpose of variable overrides is to keep sensitive credentials out of job definitions while maintaining feed verifiability:

- **Secure API Key Management**: Keep sensitive credentials out of job definitions
- **Environment-Specific Authentication**: Use different tokens for testing vs production

## Basic Syntax

Variables in oracle jobs use the template syntax `${VARIABLE_NAME}` and are replaced at execution time:

```typescript
// In your oracle job definition
{
  httpTask: {
    url: "https://api.example.com/v1/price?key=${API_KEY}&symbol=${SYMBOL}",
    method: "GET"
  }
}
```

```typescript
// When fetching signatures, provide the overrides
import { OracleJob, CrossbarClient } from "@switchboard-xyz/common";
import * as sb from "@switchboard-xyz/on-demand";

const { program } = await sb.AnchorUtils.loadEnv();
const queue = await sb.Queue.loadDefault(program!);
const crossbar = new CrossbarClient("http://crossbar.switchboard.xyz");
const gateway = await queue.fetchGatewayFromCrossbar(crossbar);

const res = await queue.fetchSignaturesConsensus({
  gateway,
  feedConfigs: [{
    feed: {
      jobs: [yourJob],
    },
  }],
  numSignatures: 1,
  useEd25519: true,
  variableOverrides: {
    "API_KEY": process.env.API_KEY!,
    "SYMBOL": "BTC"
  },
});
```

## Common Use Cases

### 1. API Authentication

Secure API integration using environment variables:

```typescript
function getPolygonStockJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          url: "https://api.polygon.io/v2/last/trade/${SYMBOL}?apiKey=${POLYGON_API_KEY}",
          method: "GET",
        }
      },
      {
        jsonParseTask: {
          path: "$.results.p",
        }
      }
    ]
  });
  return job;
}

// Usage with variable overrides
const res = await queue.fetchSignaturesConsensus({
  // ... other config
  variableOverrides: {
    "POLYGON_API_KEY": process.env.POLYGON_API_KEY!,
    "SYMBOL": "AAPL"
  },
});
```

### 2. Recommended: API Key Only Usage

The safest and recommended approach - only use variables for API keys:

```typescript
function getSecurePriceJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          // ✅ Everything hardcoded except API key
          url: "https://api.coinbase.com/v2/exchange-rates?currency=BTC&apikey=${API_KEY}",
          method: "GET"
        }
      },
      {
        jsonParseTask: {
          // ✅ Hardcoded path - verifiable data extraction
          path: "$.data.rates.USD",
        }
      }
    ]
  });
  return job;
}

// Usage - ONLY API key as variable
variableOverrides: {
  "API_KEY": process.env.COINBASE_API_KEY!  // ✅ Only credential management
}
```

### 3. Multiple API Authentication Headers

When you need multiple authentication parameters:

```typescript
function getMultiAuthJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          // ✅ Hardcoded endpoint and path - verifiable
          url: "https://api.example.com/v1/btc-price",
          method: "GET",
          headers: [
            {
              key: "Authorization",
              value: "Bearer ${AUTH_TOKEN}"  // ✅ Auth only
            },
            {
              key: "X-API-Key", 
              value: "${API_KEY}"           // ✅ Auth only
            }
          ]
        }
      },
      {
        jsonParseTask: {
          // ✅ Hardcoded path - verifiable data extraction
          path: "$.price",
        }
      }
    ]
  });
  return job;
}

// Usage - only authentication credentials as variables
variableOverrides: {
  "AUTH_TOKEN": process.env.BEARER_TOKEN!,
  "API_KEY": process.env.API_KEY!
}
```

### 4. Simple Value Substitution

For testing or static value injection:

```typescript
function getValueJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        valueTask: {
          big: "${VALUE}",
        },
      },
    ],
  });
  return job;
}

// Usage for testing
variableOverrides: {
  "VALUE": "12345.67"
}
```

## Variable Override Patterns

> **⚠️ CRITICAL**: Only use variables for API keys and authentication tokens. Everything else should be hardcoded to ensure feed verifiability.

### HTTP Headers with Authentication (Recommended Pattern)

```typescript
{
  httpTask: {
    url: "https://api.specificprovider.com/v1/btc-usd",  // ✅ Hardcoded endpoint
    method: "GET",
    headers: [
      {
        key: "Authorization",
        value: "Bearer ${ACCESS_TOKEN}"  // ✅ Only auth token variable
      },
      {
        key: "X-API-Key",
        value: "${API_KEY}"             // ✅ Only API key variable
      },
      {
        key: "User-Agent",
        value: "Switchboard-Oracle/1.0"  // ✅ Hardcoded
      }
    ]
  }
}
```

### POST Request Bodies (Auth Only)

```typescript
{
  httpTask: {
    url: "https://api.specificprovider.com/v1/query",  // ✅ Hardcoded
    method: "POST",
    headers: [
      {
        key: "Content-Type",
        value: "application/json"
      }
    ],
    // ✅ Only API key as variable, everything else hardcoded
    body: '{"symbol": "BTCUSD", "apiKey": "${API_KEY}"}'
  }
}
```

### JSON Paths (No Variables Recommended)

```typescript
{
  jsonParseTask: {
    // ✅ Completely hardcoded path - fully verifiable
    path: "$.data.price_usd"
  }
}

// ❌ Don't do this - affects data extraction:
// path: "$.${ROOT_KEY}.${DATA_KEY}[${INDEX}].${FIELD}"
```

## Testing and Development Workflow

### 1. Local Development Script

Create a testing script similar to the example:

```typescript
// scripts/test-job.ts
import { OracleJob, CrossbarClient } from "@switchboard-xyz/common";
import * as sb from "@switchboard-xyz/on-demand";

function getCustomJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          url: "${BASE_URL}/api/data?key=${API_KEY}&symbol=${SYMBOL}",
          method: "GET",
        }
      },
      {
        jsonParseTask: {
          path: "${JSON_PATH}",
        }
      }
    ]
  });
  return job;
}

(async function main() {
  const { program } = await sb.AnchorUtils.loadEnv();
  const queue = await sb.Queue.loadDefault(program!);
  const crossbar = new CrossbarClient("http://crossbar.switchboard.xyz");
  const gateway = await queue.fetchGatewayFromCrossbar(crossbar);
  
  const res = await queue.fetchSignaturesConsensus({
    gateway,
    feedConfigs: [{
      feed: {
        jobs: [getCustomJob()],
      },
    }],
    numSignatures: 1,
    useEd25519: true,
    variableOverrides: {
      "BASE_URL": process.env.BASE_URL!,
      "API_KEY": process.env.API_KEY!,
      "SYMBOL": process.env.SYMBOL || "BTC",
      "JSON_PATH": process.env.JSON_PATH || "$.price"
    },
  });
  
  console.log("Oracle responses:", res.median_responses);
})();
```

### 2. Running Tests

```bash
# Set environment variables and run
BASE_URL=https://api.example.com \
API_KEY=your_api_key_here \
SYMBOL=BTC \
JSON_PATH=$.result.price \
bun run scripts/test-job.ts
```

### 3. Environment File Approach

```bash
# Create .env file
echo "BASE_URL=https://api.example.com" >> .env
echo "API_KEY=your_api_key_here" >> .env
echo "SYMBOL=BTC" >> .env
echo "JSON_PATH=$.result.price" >> .env

# Load automatically with dotenv
bun run scripts/test-job.ts
```

## Security Best Practices

### 1. Never Hardcode Secrets

❌ **Don't do this:**
```typescript
variableOverrides: {
  "API_KEY": "sk_1234567890abcdef", // Hardcoded secret
}
```

✅ **Do this instead:**
```typescript
variableOverrides: {
  "API_KEY": process.env.API_KEY!, // From environment
}
```

### 2. Validate Required Variables

```typescript
function validateEnvironment() {
  const required = ['API_KEY', 'BASE_URL'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

// Call before using overrides
validateEnvironment();
```

### 3. Use Different Keys for Different Environments

```bash
# Development
DEV_API_KEY=dev_key_here

# Production  
PROD_API_KEY=prod_key_here
```

```typescript
const apiKey = process.env.NODE_ENV === 'production' 
  ? process.env.PROD_API_KEY 
  : process.env.DEV_API_KEY;

variableOverrides: {
  "API_KEY": apiKey!
}
```

## Error Handling and Debugging

### Common Issues

#### 1. Missing Variables
```bash
Error: Cannot read property 'undefined' of process.env
```

**Solution:** Ensure all referenced variables are defined:
```bash
# Check what variables your job needs
grep '\${' your-job-file.ts

# Set missing variables
export MISSING_VAR=value
```

#### 2. Incorrect Variable Names
Variables are case-sensitive and must match exactly:

```typescript
// Job definition uses
url: "${API_KEY}"

// Override must use same case
variableOverrides: {
  "API_KEY": "value" // ✅ Correct
  "api_key": "value" // ❌ Wrong case
}
```

#### 3. JSON Path Issues
When using variables in JSON paths, ensure the resulting path is valid:

```typescript
// This creates: "$.data.undefined.price" if FIELD is not set
path: "$.data.${FIELD}.price"

// Better: provide defaults
variableOverrides: {
  "FIELD": process.env.FIELD || "defaultField"
}
```

### Debugging Tips

1. **Log Variable Overrides**
```typescript
console.log("Variable overrides:", {
  ...Object.fromEntries(
    Object.entries(variableOverrides).map(([k, v]) => 
      [k, k.includes('KEY') || k.includes('TOKEN') ? '***' : v]
    )
  )
});
```

2. **Test API Endpoints Manually**
```bash
# Test your API endpoint with curl
curl "https://api.example.com/v1/data?key=YOUR_KEY"
```

3. **Validate JSON Paths**
```bash
# Test JSON path extraction
curl "your_api_endpoint" | jq "$.path.you.want"
```

## Real-World Examples

### Example 1: Polygon.io Stock Prices

Get stock prices from Polygon.io API with secure API key management:

```typescript
import { OracleJob, CrossbarClient } from "@switchboard-xyz/common";
import * as sb from "@switchboard-xyz/on-demand";

function getPolygonStockJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          // ✅ Hardcoded endpoint and symbol - verifiable data source
          url: "https://api.polygon.io/v2/last/trade/AAPL?apiKey=${POLYGON_API_KEY}",
          method: "GET",
        }
      },
      {
        jsonParseTask: {
          // ✅ Hardcoded path - verifiable data extraction
          path: "$.results.p",
        }
      }
    ]
  });
  return job;
}

// Usage with secure API key management
const { program } = await sb.AnchorUtils.loadEnv();
const queue = await sb.Queue.loadDefault(program!);
const crossbar = new CrossbarClient("http://crossbar.switchboard.xyz");
const gateway = await queue.fetchGatewayFromCrossbar(crossbar);

const res = await queue.fetchSignaturesConsensus({
  gateway,
  feedConfigs: [{
    feed: {
      jobs: [getPolygonStockJob()],
    },
  }],
  numSignatures: 1,
  useEd25519: true,
  variableOverrides: {
    "POLYGON_API_KEY": process.env.POLYGON_API_KEY!,  // ✅ Only API key
  },
});
```

### Example 2: ESPN Sports Scores

Get NFL final scores from ESPN API:

```typescript
import { OracleJob, CrossbarClient } from "@switchboard-xyz/common";
import * as sb from "@switchboard-xyz/on-demand";

function getESPNFootballScoreJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          // ✅ Hardcoded specific game endpoint
          url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard/401547439?apikey=${ESPN_API_KEY}",
          method: "GET",
        }
      },
      {
        jsonParseTask: {
          // ✅ Hardcoded path to home team final score
          path: "$.events[0].competitions[0].competitors[0].score",
        }
      }
    ]
  });
  return job;
}

// Usage
const { program } = await sb.AnchorUtils.loadEnv();
const queue = await sb.Queue.loadDefault(program!);
const crossbar = new CrossbarClient("http://crossbar.switchboard.xyz");
const gateway = await queue.fetchGatewayFromCrossbar(crossbar);

const res = await queue.fetchSignaturesConsensus({
  gateway,
  feedConfigs: [{
    feed: {
      jobs: [getESPNFootballScoreJob()],
    },
  }],
  numSignatures: 1,
  useEd25519: true,
  variableOverrides: {
    "ESPN_API_KEY": process.env.ESPN_API_KEY!,  // ✅ Only API key
  },
});
```

### Example 3: Twitter Follower Count

Get follower count for a specific Twitter account:

```typescript
import { OracleJob, CrossbarClient } from "@switchboard-xyz/common";
import * as sb from "@switchboard-xyz/on-demand";

function getTwitterFollowersJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          // ✅ Hardcoded user ID - verifiable target account
          url: "https://api.twitter.com/2/users/783214",  // Twitter's official account
          method: "GET",
          headers: [
            {
              key: "Authorization",
              value: "Bearer ${TWITTER_BEARER_TOKEN}"  // ✅ Only auth token
            }
          ]
        }
      },
      {
        jsonParseTask: {
          // ✅ Hardcoded path to follower count
          path: "$.data.public_metrics.followers_count",
        }
      }
    ]
  });
  return job;
}

// Usage
const { program } = await sb.AnchorUtils.loadEnv();
const queue = await sb.Queue.loadDefault(program!);
const crossbar = new CrossbarClient("http://crossbar.switchboard.xyz");
const gateway = await queue.fetchGatewayFromCrossbar(crossbar);

const res = await queue.fetchSignaturesConsensus({
  gateway,
  feedConfigs: [{
    feed: {
      jobs: [getTwitterFollowersJob()],
    },
  }],
  numSignatures: 1,
  useEd25519: true,
  variableOverrides: {
    "TWITTER_BEARER_TOKEN": process.env.TWITTER_BEARER_TOKEN!,  // ✅ Only auth token
  },
});
```

### Key Principles in These Examples

1. **Hardcoded Data Sources**: URLs specify exact endpoints and parameters
2. **Hardcoded Data Paths**: JSON paths are fixed, ensuring consistent data extraction
3. **Authentication Only Variables**: Only API keys and tokens use variable substitution
4. **Verifiable Logic**: Feed consumers can verify exactly what data is being fetched and how

### Environment Setup for Examples

```bash
# Create .env file with your API keys
echo "POLYGON_API_KEY=your_polygon_key_here" >> .env
echo "ESPN_API_KEY=your_espn_key_here" >> .env
echo "TWITTER_BEARER_TOKEN=your_twitter_token_here" >> .env
```

```bash
# Run examples
POLYGON_API_KEY=your_key bun run scripts/job-testing/runJob.ts
ESPN_API_KEY=your_key bun run scripts/job-testing/runJob.ts
TWITTER_BEARER_TOKEN=your_token bun run scripts/job-testing/runJob.ts
```

## Integration with Production Systems

### Oracle Quotes Integration

When using variable overrides with Oracle Quotes:

```typescript
// Client-side: fetch Oracle Quote with variable overrides
const [sigVerifyIx, oracleQuote] = await queue.fetchUpdateQuoteIx(
  gateway,
  crossbar,
  feedHashes,
  {
    variableOverrides: {
      "API_KEY": process.env.API_KEY!,
      "AUTH_TOKEN": process.env.AUTH_TOKEN!
    }
  }
);

// Use in your Solana program
const tx = await asV0Tx({
  connection,
  ixs: [sigVerifyIx, yourProgramIx],
  signers: [wallet],
});
```

### Production Considerations

1. **Secret Management**: Use secure secret management systems
2. **Variable Validation**: Implement runtime validation
3. **Fallback Values**: Provide sensible defaults where appropriate
4. **Monitoring**: Log variable usage for debugging (without exposing secrets)
5. **Documentation**: Clearly document required variables for each job

## Related Resources

- [Variables with CacheTask](variables-with-cachetask.md) - For internal variable management
- [REST APIs with HttpTask](rest-apis-with-httptask.md) - HTTP request configuration
- [Oracle Job Documentation](https://protos.docs.switchboard.xyz/protos/OracleJob) - Full job specification