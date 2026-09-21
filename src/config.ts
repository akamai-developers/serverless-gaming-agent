import * as variables from '@spinframework/spin-variables';

export interface Config {
  ollamaUrl: string,
  ollamaApiKey: string,
  modelName: string
}

export class ConfigError extends Error {
  constructor() {
    super("Invalid Application Configuration")
  }
}

export function loadConfig(): Config {
  const ollamaUrl = variables.get("ollama_url");
  const ollamaApiKey = variables.get("ollama_api_key");
  const modelName = variables.get("model_name");

  if (!ollamaUrl || !ollamaApiKey || !modelName) {
    throw new ConfigError();
  }
  return { ollamaUrl, ollamaApiKey, modelName } as Config;
}
