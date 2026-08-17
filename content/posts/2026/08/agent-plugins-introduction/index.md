---
date: '2026-08-16T10:40:00Z'
draft: false
title: 'Antigravity の Agent Plugins によるルール・スキル・MCP のパッケージ化'
description: 'Google Antigravity（AGY）で Skills、Rules、MCP サーバーを 1 つのディレクトリにまとめて管理・共有できる Agent Plugins のディレクトリ構造と設定方法のメモ。'
tags: ["antigravity", "agent", "plugins", "ai", "mcp"]
categories: ["Tech", "AI Development"]
---

Antigravity（AGY）でプロジェクト固有の規約（`AGENTS.md`）や手順書（`SKILL.md`）、MCP サーバーの設定が増えてきた際、これらを1つのディレクトリにまとめて管理・配布できるのが **Agent Plugins** です。

単体で設定ファイルを散らばらせる代わりに、プラグインとしてバンドルする構成と運用方法をまとめました。

---

## プラグインの構成要素

プラグインは以下の要素を1つにまとめることができます。

- **Skills (`skills/*/SKILL.md`)**: タスク手順書（Runbook）
- **Rules (`rules/AGENTS.md`)**: コーディング規約や制約
- **MCP Servers (`mcp_config.json`)**: 外部ツール接続
- **Hooks (`hooks.json`)**: ライフサイクルフック

```text
plugins/my-plugin/
├── plugin.json       # マニフェスト（必須）
├── mcp_config.json   # MCP設定（任意）
├── hooks.json        # フック設定（任意）
├── rules/            # プラグイン固有ルール（任意）
│   └── AGENTS.md
└── skills/           # プラグイン固有スキル（任意）
    └── deploy-helper/
        └── SKILL.md
```

---

## マニフェストの書き方 (`plugin.json`)

最小限の構成はプラグイン名と説明のみです。

```json
{
  "name": "devops-toolkit",
  "description": "デプロイ手順とインフラ操作プラグイン",
  "version": "1.0.0"
}
```

デフォルトで無効（OFF）にしておきたい場合は `"disabled": true` を指定します。

---

## プラグインの配置と共有パターン

### 1. プロジェクト内に配置（Git で共有）
プロジェクトの `.agents/plugins/` または `plugins/` に配置してコミットします。リポジトリをクローンした全員が同じ設定を利用できます。

### 2. 外部リポジトリの参照 (`.agents/plugins.json`)
複数プロジェクトで共通のプラグインを使いたい場合は、別リポジトリで管理し、各プロジェクトの `.agents/plugins.json` からパスを指定して読み込みます。

```json
{
  "entries": [
    {
      "path": "tools/shared-plugins"
    },
    {
      "path": "~/shared/my-company-plugins"
    }
  ]
}
```

### 3. グローバル配置（個人マシン全体で共有）
全プロジェクトで共通して使いたい個人用ツールは `~/.gemini/config/plugins/<name>/` に配置します。

---

## CLI での有効化・無効化

`agy` コマンドでプラグインの切り替えが可能です。

```bash
# 一覧表示
agy plugin list

# 有効化 / 無効化
agy plugin enable devops-toolkit
agy plugin disable devops-toolkit
```

切り替えの状態は個人のローカル設定に記録されるため、リポジトリ内のコードを変更せずに ON/OFF できます。
