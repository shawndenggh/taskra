import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, "..");

describe("database migrations", () => {
  it("requires DATABASE_URL", async () => {
    await expect(
      execFileAsync("npm", ["run", "--silent", "db:migrate"], {
        cwd: repoRoot,
        env: {
          ...process.env,
          DATABASE_URL: "",
        },
      }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("DATABASE_URL is required"),
    });
  });
});
