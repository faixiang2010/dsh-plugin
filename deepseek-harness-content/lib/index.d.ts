declare const name = "deepseek-harness-content";
/** connection 提供路由注册；llm 提供模型调用。 */
declare const inject: string[];
/** 插件配置；不填 provider/model 时自动挑第一个可用组合。 */
interface Config {
  /** 指定 provider 路由；必须与 model 一起给。 */
  readonly provider?: string;
  /** 指定模型 id；必须与 provider 一起给。 */
  readonly model?: string;
  /** 单次总结的输出上限。 */
  readonly maxOutputTokens?: number;
  /** 单次总结的超时时间（毫秒）。 */
  readonly timeoutMs?: number;
  /** 送入模型的最大字符数，超出时保留最近的对话。 */
  readonly maxInputChars?: number;
}
/** 宿主 ctx 的最小形状。 */
interface HostContext {
  effect: (callback: () => (() => void) | void, label?: string) => void;
  llm: {
    listProviders: () => readonly {
      readonly id: string;
    }[];
    listModels: (provider: string) => Promise<readonly {
      readonly id: string;
    }[]>;
    prepareCall: (config: {
      provider: string;
      model: string;
      maxTokens?: number;
    }, signal?: AbortSignal) => Promise<{
      config: Record<string, unknown>;
      stream: (options: Record<string, unknown>) => AsyncIterable<StreamChunk>;
    }>;
  };
  connection: {
    fetch: {
      register: (route: {
        path: string;
        methods: readonly string[];
        requestBody: 'buffered' | 'streaming';
        fetch: (request: Request) => Promise<Response>;
      }) => () => Promise<void>;
    };
  };
  logger?: {
    info: (message: string) => void;
    warn: (message: string) => void;
  };
}
/** llm.stream 产出的分片里本插件关心的部分。 */
type StreamChunk = {
  readonly type: 'text-delta';
  readonly text: string;
} | {
  readonly type: 'finish';
  readonly reason: {
    readonly kind: 'stop' | 'tool-calls' | 'max-tokens';
  } | {
    readonly kind: 'error' | 'aborted';
    readonly failure: {
      readonly code: string;
      readonly message: string;
    };
  };
} | {
  readonly type: string;
};
/** 注册路由；插件卸载时自动摘除。 */
declare function apply(ctx: HostContext, config?: Config): void;
export { Config, apply, inject, name };