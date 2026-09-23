import { Hono } from 'hono';
import { fire } from 'hono/service-worker';
import type { Context } from 'hono';
import { logger } from 'hono/logger';
import * as variables from '@spinframework/spin-variables';
import { createOllama } from 'ollama-ai-provider-v2';
import { stepCountIs, ToolLoopAgent } from 'ai';
import { flipCoinTool, rollDiceTool } from './tools';
import { ConfigError, loadConfig } from './config';

let app = new Hono();


app.post("/play", async (c: Context) => {
  try {
    const payload = await c.req.json();
    if (!payload.prompt) {
      return c.json({ "message": "Bad Request" }, 400);
    }

    const config = loadConfig();

    const ollama = createOllama({
      baseURL: config.ollamaUrl,
      headers: {
        "Authorization": `Bearer ${config.ollamaApiKey}`
      },
    });

    const gamingAgent = new ToolLoopAgent({
      model: ollama.chat(config.modelName),
      instructions: "You're a gaming assistant. You can play only games that are defined as tools. If you receive requests for doing something else or playing games that are not defined as tools respond with a nice message telling the user that you can only play games.",
      tools: { roll_a_dice: rollDiceTool, flip_a_coin: flipCoinTool },
      stopWhen: stepCountIs(4),
      onToolExecutionEnd({ toolCall, toolExecutionMs }) {
          console.log(`Tool ${toolCall.toolName} finished in ${toolExecutionMs}ms.`)
      }
    });

    const result = await gamingAgent.generate({
      prompt: payload.prompt

    });

    return c.json({ "result": result.text, "toolCalls": result.toolCalls}, 200);
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return c.json({ "error": error.message }, 500);
  }
})
fire(app);
