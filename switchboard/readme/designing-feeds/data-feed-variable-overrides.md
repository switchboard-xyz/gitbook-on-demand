---
description: Using variable overrides in data feeds for dynamic configuration and secure API integration
---

# Data Feed Variable Overrides

Variable overrides provide a powerful mechanism for dynamically configuring oracle jobs without hardcoding sensitive information like API keys or frequently changing parameters. This feature enables secure, flexible data feed configuration for both testing and production environments.

## What are Variable Overrides?

Variable overrides allow you to inject values into oracle job definitions at runtime using the `${VARIABLE_NAME}` syntax. This enables:

- **Secure API Key Management**: Keep sensitive credentials out of job definitions
- **Dynamic Configuration**: Change parameters without modifying job structures
- **Environment-Specific Settings**: Use different values for testing vs production
- **Flexible Data Sources**: Switch between APIs or endpoints easily

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
const res = await queue.fetchSignaturesConsensus({
  gateway: "http://localhost:8082",
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

### 2. Dynamic Price Multipliers

Adjust calculations without changing job definitions:

```typescript
function getPriceWithMultiplierJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          url: "https://api.coinbase.com/v2/exchange-rates?currency=${BASE_CURRENCY}",
        }
      },
      {
        jsonParseTask: {
          path: "$.data.rates.${QUOTE_CURRENCY}",
        }
      },
      {
        multiplyTask: {
          scalar: "${PRICE_MULTIPLIER}"
        }
      }
    ]
  });
  return job;
}

// Usage
variableOverrides: {
  "BASE_CURRENCY": "BTC",
  "QUOTE_CURRENCY": "USD", 
  "PRICE_MULTIPLIER": "1.05" // Add 5% markup
}
```

### 3. Environment-Specific Endpoints

Switch between testing and production APIs:

```typescript
function getFlexibleApiJob(): OracleJob {
  const job = OracleJob.fromObject({
    tasks: [
      {
        httpTask: {
          url: "${BASE_URL}/api/${API_VERSION}/data",
          method: "GET",
          headers: [
            {
              key: "Authorization",
              value: "Bearer ${AUTH_TOKEN}"
            },
            {
              key: "X-API-Version", 
              value: "${API_VERSION}"
            }
          ]
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

// Development environment
variableOverrides: {
  "BASE_URL": "https://api-dev.example.com",
  "API_VERSION": "v1",
  "AUTH_TOKEN": process.env.DEV_AUTH_TOKEN!,
  "JSON_PATH": "$.result.price"
}

// Production environment
variableOverrides: {
  "BASE_URL": "https://api.example.com",
  "API_VERSION": "v2", 
  "AUTH_TOKEN": process.env.PROD_AUTH_TOKEN!,
  "JSON_PATH": "$.data.currentPrice"
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

### HTTP Headers with Authentication

```typescript
{
  httpTask: {
    url: "${API_ENDPOINT}",
    method: "GET",
    headers: [
      {
        key: "Authorization",
        value: "Bearer ${ACCESS_TOKEN}"
      },
      {
        key: "X-API-Key",
        value: "${API_KEY}"
      },
      {
        key: "User-Agent",
        value: "${USER_AGENT}"
      }
    ]
  }
}
```

### POST Request Bodies

```typescript
{
  httpTask: {
    url: "${API_ENDPOINT}",
    method: "POST",
    headers: [
      {
        key: "Content-Type",
        value: "application/json"
      }
    ],
    body: '{"query": "${QUERY}", "limit": ${LIMIT}, "apiKey": "${API_KEY}"}'
  }
}
```

### Complex JSON Paths

```typescript
{
  jsonParseTask: {
    path: "$.${ROOT_KEY}.${DATA_KEY}[${INDEX}].${VALUE_FIELD}",
  }
}

// Example overrides
variableOverrides: {
  "ROOT_KEY": "results",
  "DATA_KEY": "prices", 
  "INDEX": "0",
  "VALUE_FIELD": "current_price"
}
// Results in: "$.results.prices[0].current_price"
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
  
  const res = await queue.fetchSignaturesConsensus({
    gateway: "http://localhost:8082",
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

## Integration with Production Systems

### Bundle Method Integration

When using variable overrides with the bundle method:

```typescript
// Client-side: fetch bundle with variable overrides
const [sigVerifyIx, bundle] = await queue.fetchUpdateBundleIx(
  gateway,
  crossbar,
  feedHashes,
  {
    variableOverrides: {
      "API_KEY": process.env.API_KEY!,
      "SYMBOL": tradingPair,
      "MULTIPLIER": priceAdjustment.toString()
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