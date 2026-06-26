#!/usr/bin/env node
import { Command } from "commander";

import { readModelConfig, writeModelConfig, type ModelProvider } from "./config.js";

const program = new Command();

program.name("taskra").description("Inspectable local agent harness");

const configCommand = new Command("config").description("Manage Taskra config");

configCommand
  .command("show")
  .description("Show effective Taskra config")
  .action(async () => {
    const config = await readModelConfig();

    process.stdout.write(`LLM provider: ${config.provider}\n`);
    process.stdout.write(`LLM model: ${config.model}\n`);
    process.stdout.write(`Source: ${config.source}\n`);
  });

configCommand
  .command("set-model")
  .description("Set the default LLM provider and model")
  .argument("<provider>", "LLM provider: deepseek or openai")
  .argument("<model>", "LLM model name")
  .action(async (provider: string, model: string) => {
    if (provider !== "deepseek" && provider !== "openai") {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    await writeModelConfig({ provider: provider as ModelProvider, model });
    process.stdout.write(`Saved default LLM: ${provider}/${model}\n`);
  });

program.addCommand(configCommand);

await program.parseAsync(process.argv);
