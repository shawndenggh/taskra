# Agent Harness MVP PRD

## 问题陈述

用户想要一个本地 Agent Harness，让 agent 的工作过程可检查、可重复，并且难以糊弄。一次成功的 run 应该留下持久化证据：用户提出了什么请求，系统如何理解意图，调用了哪些工具，使用了哪些外部数据，模型生成了什么，以及为什么最终回答值得信任。

第一个验证场景是真实天气查询。它不是产品方向本身，而是一条足够窄的可执行闭环，用来证明 harness 能编排 LLM、工具调用、流式输出、会话继续和持久化 run 证据。

## 解决方案

构建一个基于 TypeScript/Node.js 的 CLI，并使用 Postgres 做持久化。CLI 运行一个单进程 orchestrator，通过显式 stage 执行天气查询：

1. 接收用户 prompt。
2. 创建或继续 session。
3. 创建 run。
4. 使用 LLM Provider 对意图分类并抽取位置。
5. 调用第一方 `get_weather` tool，数据来源为 Open-Meteo。
6. 使用选中的 LLM Provider 将最终回答流式输出到 CLI。
7. 持久化 messages、runs、stages、tool calls、final answer、provider metadata、status 和 errors。
8. 允许用户通过 CLI 查看 sessions 和 runs。

MVP 支持 session 级继续：在已有 session 下创建新的 run。MVP 不支持同一个 run 从失败 stage 原地恢复，但数据模型应该为未来 stage 级恢复保留空间。

## 用户故事

1. 作为本地开发者，我想从 CLI 运行天气查询，以便在没有 Web UI 的情况下验证 harness。
2. 作为本地开发者，我想第一次 run 自动创建 session，以便最简单路径下不需要手动管理 session ID。
3. 作为本地开发者，我想 CLI 在 run 结束后打印 session ID 和 run ID，以便之后检查或继续。
4. 作为本地开发者，我想通过传入 session ID 继续会话，以便后续 prompt 可以使用历史上下文。
5. 作为本地开发者，我想在上海天气查询之后输入“那北京呢？”也能工作，以便证明 harness 可以使用 session context。
6. 作为本地开发者，我想非支持范围内的 prompt 被分类为 unsupported，以便 MVP 不假装能处理任意任务。
7. 作为本地开发者，我想天气相关 prompt 被分类为 weather query，以便工具执行由意图驱动，而不是写死 prompt 匹配。
8. 作为本地开发者，我想 harness 能从 prompt 中抽取位置，以便天气工具可以调用真实数据源。
9. 作为本地开发者，我想当天气查询缺少位置时，系统追问位置，以便自然验证会话继续能力。
10. 作为本地开发者，我想天气工具获取真实天气数据，以便验证场景证明真实工具执行。
11. 作为本地开发者，我想 MVP 使用 Open-Meteo 作为天气数据来源，以便第一版不需要天气 API key。
12. 作为本地开发者，我想回答包含当前天气以及从今天开始的三个自然日天气，以便行为具体且可测试。
13. 作为本地开发者，我想最终回答在 CLI 中流式输出，以便第一版体验与未来 UI 目标一致。
14. 作为本地开发者，我想最终回答只基于已记录的 tool result，以便模型不能编造天气事实。
15. 作为本地开发者，我想每次 run 都持久化 stages，以便检查 run 在哪里花了时间、在哪里失败。
16. 作为本地开发者，我想每次 tool call 都持久化 input、output summary、status 和 timing，以便审计外部数据使用。
17. 作为本地开发者，我想 run log 记录实际使用的 LLM provider 和 model，以便之后比较不同模型的行为。
18. 作为本地开发者，我想 API key 不写入日志和配置文件，以便持久化证据不泄露密钥。
19. 作为本地开发者，我想 DeepSeek 作为默认模型 provider，以便 CLI 符合我的默认偏好。
20. 作为本地开发者，我想通过 CLI 配置默认模型，以便不用手动编辑配置文件。
21. 作为本地开发者，我想对单次 run 覆盖模型配置，以便比较 OpenAI 和 DeepSeek 的行为。
22. 作为本地开发者，我想 OpenAI 和 DeepSeek 位于同一个 LLM Provider 抽象之后，以便 orchestrator 不关心供应商差异。
23. 作为本地开发者，我想 LLM Provider 抽象支持共同的 chat、tool calling、structured output 和 streaming 能力，以便 provider 特有能力不泄漏进 MVP。
24. 作为本地开发者，我想列出近期 sessions，以便不用手动查询 Postgres 也能看到持久化会话状态。
25. 作为本地开发者，我想通过 run ID 查看 run，以便从 CLI 复查完整证据链。
26. 作为未来产品构建者，我想模型单独存储 sessions、messages、runs、stages 和 tool calls，以便未来 Web UI 和恢复能力有稳定基础。
27. 作为未来产品构建者，我想当前实现避免通用 provider marketplace，以便 MVP 专注第一条可执行闭环。

## 实施决策

- MVP 是一个 TypeScript/Node.js CLI。
- Postgres 是唯一持久化数据库，用于保存 sessions、messages、runs、stages、tool calls、final answers、metadata、statuses 和 errors。
- CLI 支持 `run`、`config`、`sessions` 和 `runs` 命令组。
- `taskra run "上海天气怎么样？"` 是主要 happy path。
- `taskra run --session <session_id> "那北京呢？"` 是主要 continuation path。
- `taskra config set-model <provider> <model>` 保存默认模型 provider 和 model。
- `taskra config show` 显示当前有效的默认模型配置。
- `taskra run --llm <provider>:<model>` 对单次 run 覆盖 provider 和 model。
- 如果没有模型配置，默认 provider 是 DeepSeek，默认 model 是 `deepseek-chat`。
- API keys 从环境变量读取，永不持久化。
- 非密钥 CLI 配置存储在数据库之外，以便 Postgres 不可用时仍可检查。
- 第一版 orchestrator 是单进程 orchestrator，带显式 stages，不是真正的多 agent runtime。
- stages 需要命名清晰，便于检查编排行为：intent analysis、weather tool execution、response streaming、verification 和 persistence。
- MVP 只支持 `weather_query` 和 `unsupported` 两种意图。
- 缺少 location 时追问用户，而不是使用默认位置。
- session continuation 表示在已有 session 下创建新的 run，并将历史 messages 作为上下文。
- MVP 不支持同一个 run 从停止的失败 stage 原地恢复。
- schema 仍然需要记录 stage status、inputs、outputs、timing 和 errors，以便未来添加 stage 级恢复。
- 面向 agent 的天气能力是 `get_weather` tool。
- 天气 tool 是 harness 拥有的第一方代码，不是模型自由联网浏览。
- Open-Meteo 是 MVP 唯一天气数据源。
- 天气 tool 返回当前天气以及今天、明天、后天的天气。
- LLM Provider 抽象覆盖 OpenAI 和 DeepSeek 所需的共同能力。
- MVP 实现 OpenAI 和 DeepSeek。
- LLM Provider 抽象包含 provider ID、model ID、API mode、base URL、chat completion、structured output、tool calls、streaming、usage、latency 和 raw response metadata。
- MVP 尽量让 OpenAI 和 DeepSeek 都走 OpenAI-compatible Chat Completions 形态。
- Provider 特有的高级能力不进入 MVP。
- Intent analysis 非 streaming，并返回结构化数据。
- Final answer generation 必须使用选定 LLM Provider 的真实 streaming。
- CLI renderer 在收到 answer chunks 时立即打印。
- 数据库在 streaming 完成后持久化完整 final answer。
- MVP 不把每个 streamed token 作为独立持久化事件存储。
- 如果 streaming 中途失败，run 记录 failure metadata 和有用的 partial answer summary。
- Run inspection 应显示 user input、detected intent、plan、stages summary、tool calls summary、final answer 和 errors。

## 测试决策

- 最高价值的测试 seam 是 CLI 端到端行为：一个命令应该创建 session、创建 run、执行 stages、调用 weather tool、流式输出 answer，并持久化可检查证据。
- 测试应断言外部可见行为和持久化记录，而不是内部实现细节。
- Happy-path 测试应覆盖 `taskra run "上海天气怎么样？"`，使用真实编排边界和受控测试数据库。
- Continuation 测试应覆盖第二次 `taskra run --session <session_id> "那北京呢？"`，并验证它在同一 session 下创建新 run。
- Missing-location 测试应验证缺少位置的天气 prompt 会生成追问，并持久化结果。
- Unsupported-intent 测试应验证无关 prompt 不会调用 weather tool。
- LLM Provider contract tests 应验证 normalized message output、structured intent output、streaming chunks、usage metadata 和 error normalization。
- Weather tool contract tests 应验证 Open-Meteo geocoding、forecast fetch、normalization 和 failure handling。
- Persistence tests 应验证 sessions、messages、runs、stages、tool calls、statuses、timestamps、final answers 和 errors 一致写入。
- CLI inspection tests 应验证 `sessions list` 和 `runs show <run_id>` 输出足够信息，让用户不用打开 Postgres 也能检查 run。
- 测试不应依赖模型逐字输出。
- 测试可以使用受控 provider fake 来保证确定性，但产品的第一条手动验收路径必须使用真实天气数据。

## 不在范围内

- Web UI。
- 真正的多 agent 并发。
- 同一个 run 内的 stage-level checkpoint resume。
- 多个天气 provider。
- 将 mock weather 作为主要产品路径。
- Token 级 stream 持久化。
- OpenAI 和 DeepSeek 之间的自动 fallback。
- Credential pools。
- Provider plugin marketplace。
- 通用 tool marketplace。
- OpenAI built-in web search。
- Provider-specific reasoning controls。
- Vision、file input、audio input 或其他多模态能力。
- 远程同步。
- 多用户账号、认证、授权或租户隔离。
- 后台 worker queues。
- 完整 workflow-engine 语义。

## 补充说明

- 天气场景刻意保持窄范围。它用于验证 harness，不是为了构建天气产品。
- 第一版应避免在天气闭环证明 orchestration、streaming、persistence、continuation 和 inspection 之前添加更多 tools。
- Schema 应从第一天就按 Postgres 设计，避免之后从 SQLite 迁移到 Postgres。
- 实现应把 provider-specific quirks 隔离在 LLM Provider 层，把 Open-Meteo-specific quirks 隔离在 weather tool 实现里。
- 未来 Web UI 应能复用 CLI 创建的 session、run、stage、tool-call 和 message 记录。
