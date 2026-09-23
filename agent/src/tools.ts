import { tool } from "ai";
import z from "zod";

const flipCoinTool = tool({
  description: "Flips a coin. Resulting either in heads or tails",
  inputSchema: z.object({}),
  execute: async () => {
    const side = Math.random() < 0.5 ? "heads" : "tails";
    return { result: side };
  }
});

const rollDiceTool = tool({
  description: "Rolls a multi-sided dice. Specify the number of sides when invoking the tool",
  inputSchema: z.object({
    sides: z.number().describe("How many sides should the dice have?")
  }),
  execute: async ({ sides }) => {
    const min = 1;
    const eyes = Math.floor(Math.random() * sides) + min;
    return { result: eyes };
  }
})

export { flipCoinTool, rollDiceTool }
