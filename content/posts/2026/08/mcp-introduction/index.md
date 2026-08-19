---
date: '2026-08-16T11:20:00Z'
draft: true
title: 'Model Context Protocol（MCP）の仕組みと設定方法メモ'
description: 'AIエージェントと外部ツールを接続するオープン標準「Model Context Protocol（MCP）」の仕組み、Tools/Resources/Promptsの構造、Antigravityでの設定とTypeScriptでの自作サーバー実装メモ。'
tags: ["mcp", "ai", "agent", "antigravity", "architecture"]
categories: ["Tech", "AI Development"]
---

AIエージェントに外部ツールを実行させたり、ローカルファイルやDBを参照させたりする仕組みとして、Anthropicが提唱した **Model Context Protocol（MCP）** が標準規格になりつつあります。

これまでエージェントごとに個別に書いていたAPI連携コードを、Language Server Protocol（LSP）のように共通のプロトコルで抽象化できるのが特徴です。Antigravityでの設定方法やサーバーの実装手順を整理しました。

---

## アーキテクチャ

MCPはホスト・クライアント・サーバーの3層構造で動作します。通信プロトコルはJSON-RPC 2.0です。

```text
+----------------------------------------------------------------+
| Host (Antigravity, Claude Desktop, Cursor 等)                 |
|   +-------------------+              +---------------------+   |
|   |   LLM / Agent     |              |   MCP Client        |   |
|   +---------+---------+              +----------+----------+   |
+-------------|-----------------------------------|--------------+
              | 内部連携                           | JSON-RPC 2.0
              v                                   v (Stdio / SSE)
+----------------------------------------------------------------+
| MCP Server (GitHub, SQLite, 社内API など)                       |
|   [ Tools (関数実行) ]  [ Resources (データ) ]  [ Prompts ]    |
+----------------------------------------------------------------+
```

### 3つの役割
1. **Host**: エージェントを実行する親アプリケーション（Antigravity, IDE等）
2. **Client**: Host内で動き、各MCPサーバーとの通信を中継するクライアント
3. **Server**: ファイル操作やDB検索などの機能を公開する軽量プロセス

---

## 3つの基本機能（Primitives）

MCPサーバーがエージェントに公開する機能は主に以下の3つです。

| 種類 | 役割 | 具体例 |
| :--- | :--- | :--- |
| **Tools** | エージェントが実行する関数（副作用あり） | PR作成、SQLクエリ実行、APIリクエスト |
| **Resources** | エージェントが読み込むデータ（URI形式） | ログファイル、DBスキーマ、ドキュメント |
| **Prompts** | 定型プロンプトのテンプレート | コードレビューの指示文、バグ調査のテンプレート |

---

## 通信方式（Stdio と SSE）

サーバーの起動・接続方式には大きく2種類あります。

- **Stdio Transport（ローカル実行）**
  - 親プロセスからコマンドを直接起動し、標準入出力（stdin / stdout）でやり取りする。
  - ローカルファイル操作やSQLite連携など、同一マシン上で動かす場合はこれが基本。
- **SSE Transport（HTTP / リモート実行）**
  - Server-Sent Eventsを使ったHTTP接続。社内共有サーバーやクラウド上のサービスと繋ぐ際に使う。

---

## Antigravity での設定方法

設定ファイル（`mcp_config.json`）に実行コマンドを記述します。

### 設定ファイルの配置場所
- グローバル: `~/.gemini/config/mcp_config.json`
- プロジェクト単位: `.agents/mcp_config.json`

### 設定例
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxx"
      }
    },
    "sqlite-db": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/data/app.db"]
    }
  }
}
```

`npx -y` や `uvx` を使うと、パッケージを事前にグローバルインストールすることなくオンデマンドで起動できます。

---

## TypeScript で自作サーバーを作る

公式の `@modelcontextprotocol/sdk` を使えば、数十行で独自のMCPサーバーを実装できます。

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "weather-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 公開するツールの定義
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_weather",
        description: "指定した都市の現在の天気を取得する",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", description: "都市名（例: Tokyo, Osaka）" }
          },
          required: ["city"]
        }
      }
    ]
  };
});

// ツールの実行処理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_weather") {
    const city = String(request.params.arguments?.city);
    return {
      content: [
        {
          type: "text",
          text: `${city} の天気は晴れ、気温は 24℃ です。`
        }
      ]
    };
  }
  throw new Error("Unknown tool");
});

// Stdioで接続待機
const transport = new StdioServerTransport();
await server.connect(transport);
```

ツール定義の `description` と引数のスキーマが、LLMが「いつこのツールを呼ぶか」を判断する材料になるため、ここを具体的に書くのがポイントです。

---

## 運用の注意点

- **トークンの秘匿**: `mcp_config.json` に生のトークンを書かず、`${localEnv:GITHUB_TOKEN}` や環境変数から渡すようにする。
- **権限の最小化**: DBやクラウドの操作をエージェントに任せる場合は、更新・削除権限のないReadOnlyユーザーを割り当てておくと安全。
