import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, "..");

async function runTaskra(
  args: string[],
  taskraHome: string,
  extraEnv: NodeJS.ProcessEnv = {},
) {
  return execFileAsync("npm", ["run", "--silent", "taskra", "--", ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      TASKRA_HOME: taskraHome,
      ...extraEnv,
    },
  });
}

describe("taskra config", () => {
  let taskraHome: string;

  beforeEach(async () => {
    taskraHome = await mkdtemp(path.join(tmpdir(), "taskra-test-"));
  });

  afterEach(async () => {
    await rm(taskraHome, { recursive: true, force: true });
  });

  it("shows deepseek/deepseek-chat when no model config exists", async () => {
    const { stdout } = await runTaskra(["config", "show"], taskraHome);

    expect(stdout).toContain("LLM provider: deepseek");
    expect(stdout).toContain("LLM model: deepseek-chat");
    expect(stdout).toContain("Source: default");
  });

  it("sets and shows the configured model", async () => {
    await runTaskra(["config", "set-model", "openai", "gpt-4.1-mini"], taskraHome);

    const { stdout } = await runTaskra(["config", "show"], taskraHome);

    expect(stdout).toContain("LLM provider: openai");
    expect(stdout).toContain("LLM model: gpt-4.1-mini");
    expect(stdout).toContain("Source: file");
  });

  it("stores only non-secret model config", async () => {
    await runTaskra(["config", "set-model", "deepseek", "deepseek-chat"], taskraHome, {
      DEEPSEEK_API_KEY: "deepseek-secret",
      OPENAI_API_KEY: "openai-secret",
    });

    const rawConfig = await readFile(path.join(taskraHome, "config.json"), "utf8");

    expect(JSON.parse(rawConfig)).toEqual({
      provider: "deepseek",
      model: "deepseek-chat",
    });
    expect(rawConfig).not.toContain("deepseek-secret");
    expect(rawConfig).not.toContain("openai-secret");
  });
});
