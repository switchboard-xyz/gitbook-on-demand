# LLMs Integration

The `LlmTask` in Switchboard enables integration with Large Language Models (LLMs) for dynamic, AI-powered data generation. You can configure the task to work with providers like OpenAI, Groq, or GrokXAI to include AI insights in your data feeds.

## Supported Providers

Switchboard currently supports the following LLM providers for use with `LlmTask`:

1. **OpenAI**
2. **Groq**
3. **GrokXAI**
4. **... more to come**

## Configuration

The `LlmTask` requires the following configurations:

* **Provider**: Specify the LLM provider (e.g., OpenAI, Groq, GrokXAI).
* **Model**: Define the AI model (e.g., `gpt-4o-mini`, `llama3-8b-8192`, `grok-beta`).
* **Prompt**: Provide the user prompt to guide the AI model.
* **Temperature**: Adjust the randomness of responses (e.g., `0.0` for deterministic outputs, up to `2.0`).
* **Secret API Key**: This is the **name of the variable** that contains your API key. You can provide this via variable overrides when fetching signatures. See [Data Feed Variable Overrides](data-feed-variable-overrides.md) to learn how to use variable overrides for secure API key management!

## Limitations

While LlmTask is a powerful tool, it operates with the following limitations to maintain consistency and ensure compatibility with Switchboard feeds:

* **Single Numerical Value Output**:
  * The output of `LlmTask` must be a single numerical value formatted as JSON. This ensures that the result can be directly used in data feeds and avoids ambiguity. \
    Example:

{% code fullWidth="false" %}
```json
{ "answer": 42 }
```
{% endcode %}

* **Sensitive Content Handling**
  * LLMs may not handle sensitive or inappropriate prompts. The task is configured to provide a standardised user prompt and response to avoid inappropriate output.

## Example Task Configuration&#x20;

```json
{
  "tasks": [
    {
      "secretsTask": {
        "authority": "your-authority-public-key"
      }
    },
    {
      "llmTask": {
        "grokxai": {
          "model": "grok-beta",
          "userPrompt": "What would you say is the probability as a percentage, of buying ETH USD right now based on current social media sentiment?",
          "temperature": 0.2,
          "secretNameApiKey": "my-api-key-secret"
        }
      }
    }
  ]
}
```

For an example of how to build an feed that makes use of LLM - see [here!](https://github.com/switchboard-xyz/sb-on-demand-examples/tree/main/sb-on-demand-secret/sb-on-demand-secrets-llm)

### NB - REMEMBER TO PROVIDE YOUR API KEY VIA VARIABLE OVERRIDES WHEN FETCHING SIGNATURES :)&#x20;

