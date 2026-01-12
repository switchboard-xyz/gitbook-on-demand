---
description: Calculate time-weighted average prices using SurgeTwapTask
---

# Time-Weighted Average Prices

Time-weighted average price (TWAP) is a pricing algorithm that calculates the average price of an asset over a specified time period. TWAP provides manipulation-resistant pricing by averaging prices over a configurable time window, weighted by the duration each price was observed.

## SurgeTwapTask

The `surgeTwapTask` calculates TWAP from Switchboard's streaming price data. The algorithm weights each observed price by how long it was in effect:

```
TWAP = Σ(price × duration) / Σ(duration)
```

### Basic Example

```typescript
{
    surgeTwapTask: {
        symbol: "BTC/USD",
        timeInterval: "ONE_HOUR"
    }
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | Yes | - | Trading pair in `*/USD` format (e.g., "BTC/USD", "ETH/USD", "SOL/USD") |
| `timeInterval` | TimeInterval | No | ONE_HOUR | Lookback window for TWAP calculation |

### Time Intervals

| Interval | Duration | Description |
|----------|----------|-------------|
| `FIVE_MINUTES` | 5 min | Shortest window, most responsive to price changes |
| `TEN_MINUTES` | 10 min | |
| `FIFTEEN_MINUTES` | 15 min | |
| `THIRTY_MINUTES` | 30 min | |
| `ONE_HOUR` | 1 hour | Default, balances responsiveness and stability |
| `TWO_HOURS` | 2 hours | |
| `SIX_HOURS` | 6 hours | |
| `TWELVE_HOURS` | 12 hours | Most stable, least responsive |

### Constraints

- Only `*/USD` pairs are supported (e.g., "BTC/USD", "SOL/USD")
- The task will fail if a non-USD quote currency is provided

## Use Cases

**Lending Protocols** — Use TWAP for liquidation price checks to prevent flash loan attacks that temporarily manipulate spot prices.

**Perpetual Exchanges** — Funding rate calculations based on TWAP reduce the impact of short-term price spikes.

**Options and Derivatives** — Settlement prices based on TWAP reduce the impact of last-minute price manipulation.

**AMMs and DEXs** — TWAP oracles provide manipulation-resistant prices for concentrated liquidity ranges or limit orders.

## Examples

### 30-Minute TWAP for SOL/USD

```typescript
{
    surgeTwapTask: {
        symbol: "SOL/USD",
        timeInterval: "THIRTY_MINUTES"
    }
}
```

### TWAP with Price Bounds

Combine TWAP with bounding to ensure the calculated average stays within expected ranges:

```typescript
{
    surgeTwapTask: {
        symbol: "ETH/USD",
        timeInterval: "ONE_HOUR"
    }
},
{
    boundTask: {
        lowerBoundValue: "1000",
        upperBoundValue: "10000"
    }
}
```

### Multiple TWAP Sources

Use a median task to aggregate TWAPs from multiple assets:

```typescript
{
    medianTask: {
        tasks: [
            {
                surgeTwapTask: {
                    symbol: "BTC/USD",
                    timeInterval: "ONE_HOUR"
                }
            },
            {
                surgeTwapTask: {
                    symbol: "ETH/USD",
                    timeInterval: "ONE_HOUR"
                }
            }
        ]
    }
}
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `symbol is empty` | Missing symbol parameter | Provide a valid symbol |
| `only supports */USD pairs` | Non-USD quote currency | Use USD pairs only (e.g., "BTC/USD" not "BTC/EUR") |
| `no candle data available` | No price data in lookback window | Verify the trading pair is supported |

## How It Works

The TWAP calculation uses Switchboard's continuous price streaming infrastructure:

1. Price ticks are accumulated into 5-minute candles
2. Each candle stores the time-weighted sum and observed duration
3. When queried, candles spanning the requested interval are aggregated
4. The final TWAP is computed by dividing total weighted sum by total duration

The system includes gap protection: if price updates are interrupted for more than 5 seconds, that gap does not contribute to the TWAP calculation. This prevents stale prices from being over-weighted during network interruptions or exchange outages.

A variance check compares the TWAP against secondary price sources. If the coefficient of variation exceeds 0.4%, the task fails to protect against compromised exchange data.
