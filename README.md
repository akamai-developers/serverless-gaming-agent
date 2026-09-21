# Gaming Agent

The Gaming Agent is a Spin application that exposes a small AI agent over HTTP. It talks to an Ollama-compatible LLM and can play simple games through tools — rolling a multi-sided dice and flipping a coin. Send a `POST /play` request with a JSON body like `{ "prompt": "roll a 20-sided dice" }` and the agent responds with the result.

## Application Variables

The agent reads its configuration from these Spin application variables:

| Variable          | Required | Default | Description                                         |
|-------------------|----------|---------|-----------------------------------------------------|
| `ollama_base_url` | yes      | —       | Base URL of the Ollama-compatible endpoint          |
| `ollama_api_key`  | yes      | —       | API key sent as a bearer token (secret)             |
| `model_name`      | yes      | —       | Name of the model to use (e.g. `qwen2.5:7b`)        |
| `ollama_api_path` | no       | `/api`  | API path appended to the base URL                   |

## Run Locally

When running with `spin up --build`, provide the required variables through
`SPIN_VARIABLE_*` environment variables:

```bash
export SPIN_VARIABLE_ollama_base_url="http://localhost:8080"
export SPIN_VARIABLE_ollama_api_key="<your-api-key>"
export SPIN_VARIABLE_model_name="qwen2.5:7b"

spin up --build
```

## Deploy to Akamai Functions

When deploying to Akamai Functions, set the variables by using the `--variable` flag:

```bash
spin aka deploy --build \
  --variable ollama_base_url="https://your-ollama-host:8080" \
  --variable ollama_api_key="<your-api-key>" \
  --variable model_name = "qwen2.5:7b"
```
