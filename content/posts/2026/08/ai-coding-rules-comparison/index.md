---
date: '2026-08-16T11:35:00Z'
draft: false
title: 'Copilot・Cursor・Antigravity のカスタム指示ファイル設定まとめ'
description: 'GitHub Copilot（copilot-instructions.md）、Cursor（.cursorrules / .mdc）、Antigravity（AGENTS.md）のルール設定仕様の違いと、実用的な書き方の整理。'
tags: ["copilot", "github", "cursor", "antigravity", "ai", "rules"]
categories: ["Tech", "AI Development"]
---

AIコーディングツールにチームのコーディング規約や設計方針を伝えるための設定ファイル（Instructions / Rules）について、Copilot、Cursor、Antigravity の3ツールの仕様を比較・整理しました。

---

## 3ツールの設定ファイル比較

| ツール | 設定ファイル | 配置場所 | 適用範囲と特徴 |
| :--- | :--- | :--- | :--- |
| **GitHub Copilot** | `copilot-instructions.md` | `.github/` | リポジトリ全体。ChatやPR要約で参照される |
| **Cursor** | `.cursorrules` / `*.mdc` | ルート / `.cursor/rules/` | glob指定で拡張子・パス別のルール分割が可能 |
| **Antigravity** | `AGENTS.md` / `GEMINI.md` | 任意ディレクトリ / `.agents/rules/` | 階層遡り（Walk-up）走査。Skillsと分離して管理 |

---

## 1. GitHub Copilot (`.github/copilot-instructions.md`)

`.github/copilot-instructions.md` にMarkdownで規約を記述します。

```markdown
# GitHub Copilot Instructions

## 技術スタック
- Node.js (v20+), TypeScript (v5+), React (Next.js App Router)
- スタイリング: Tailwind CSS (v3)

## コーディング規約
- コンポーネントは関数コンポーネントで定義する（`React.FC` は非推奨）。
- 非同期処理は `try-catch` でエラーハンドリングする。
- `any` 型は使わず、型ガードと `unknown` を使う。
```

リポジトリ全体に1枚で効くシンプルな構成です。

---

## 2. Cursor (`.cursorrules` / `.cursor/rules/*.mdc`)

単一ファイルの `.cursorrules` のほか、`.cursor/rules/` 配下にフロントマター付きの `.mdc` ファイルを複数配置できます。

```markdown
---
description: フロントエンド開発規約
globs: src/components/**/*.{ts,tsx}, src/app/**/*.{ts,tsx}
---

# Frontend Guidelines
- Server Components をデフォルトとし、必要な場合のみ `'use client'` を宣言する。
- アイコンは `lucide-react` を使う。
```

`globs` で対象ファイルを絞り込めるため、フロントエンドとバックエンドでルールを分けたい場合に便利です。

---

## 3. Google Antigravity (`AGENTS.md` / `GEMINI.md`)

プロジェクトルートや各ディレクトリに `AGENTS.md` を配置します。

```markdown
# Project Standards
- コミットメッセージは Conventional Commits 形式にする。
- 外部API呼び出しにはリトライ処理とタイムアウト（最大5000ms）を設定する。
```

- **階層走査（Walk-up）**: サブディレクトリのファイルを編集する際、親ディレクトリを自動で遡ってルールをマージします。
- **Skills との役割分担**: 規約は `AGENTS.md`、手順書は `.agents/skills/` に切り分けて管理します。

---

## ルールを書くときの注意点

1. **「禁止」だけでなく代替案を書く**
   - 「`any` 禁止」だけでなく「`any` は使わず `unknown` と型ガードを使う」と書く。
2. **一般論は省く**
   - 「読みやすいコードを書く」などLLMが元から知っている常識は不要。プロジェクト固有のライブラリやディレクトリ構造に集中させる。
3. **長大な手順はルールに書かない**
   - デプロイ手順等の長文は常時読み込みのルールファイルには書かず、Skills 等のオンデマンド機構に分離する。
