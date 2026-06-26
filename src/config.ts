import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ModelProvider = "deepseek" | "openai";

export type ModelConfig = {
  provider: ModelProvider;
  model: string;
};

export type EffectiveModelConfig = ModelConfig & {
  source: "default" | "file";
};

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: "deepseek",
  model: "deepseek-chat",
};

export function getTaskraHome(env: NodeJS.ProcessEnv = process.env): string {
  return env.TASKRA_HOME ?? path.join(process.cwd(), ".taskra");
}

export function getConfigPath(taskraHome = getTaskraHome()): string {
  return path.join(taskraHome, "config.json");
}

export async function readModelConfig(
  taskraHome = getTaskraHome(),
): Promise<EffectiveModelConfig> {
  try {
    const rawConfig = await readFile(getConfigPath(taskraHome), "utf8");
    const parsedConfig = JSON.parse(rawConfig) as Partial<ModelConfig>;

    if (parsedConfig.provider === "deepseek" || parsedConfig.provider === "openai") {
      if (typeof parsedConfig.model === "string" && parsedConfig.model.length > 0) {
        return {
          provider: parsedConfig.provider,
          model: parsedConfig.model,
          source: "file",
        };
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  return {
    ...DEFAULT_MODEL_CONFIG,
    source: "default",
  };
}

export async function writeModelConfig(
  config: ModelConfig,
  taskraHome = getTaskraHome(),
): Promise<void> {
  await mkdir(taskraHome, { recursive: true });
  await writeFile(getConfigPath(taskraHome), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
