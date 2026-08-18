---
date: '2026-08-17T02:40:00Z'
draft: false
title: 'Antigravity CLI で実践する自律実行ループ設計（ループエンジニアリング）'
description: 'AIコーディングエージェントを自律走行させるための環境設計論。なぜループが必要なのか、その本質とAddy Osmani氏の5要素モデル、Learnings.mdによる2層メモリ構造、Dev Containersを用いた5ステップ完全実践ハンズオンガイド。'
tags: ["antigravity", "agent", "loop-engineering", "harness-engineering", "ai", "cli", "learnings", "devcontainers"]
categories: ["Tech", "AI Development"]
---

## ループエンジニアリング

AIコーディングエージェント（Antigravity、Claude Code、Cursor 等）の活用において、今まさに大きなパラダイムシフトが起きています。
PSPDFKit 創業者のピーター・スタインバーガー（Peter Steinberger）氏は、次のように述べました。

> 「コーディングエージェントに直接指示を与えるべきではない。エージェントに指示を与えるループを設計すべきだ」
> — Peter Steinberger (Founder, PSPDFKit)

同様に、Anthropic 社で Claude Code の開発を率いるボリス・チェルニー（Boris Cherny）氏も語っています（[Acquired Unplugged presented by WorkOS, 2026-06-02](https://www.youtube.com/watch?v=RkQQ7WEor7w)）。

> 「私はもう、Claude に直接指示を与えていません。Claude に指示を与え、何をすべきかを判断させるループを実行しています。私の仕事は **『ループ（仕組み）』** を書くことです。」
> — Boris Cherny (Head of Claude Code, Anthropic)

### なぜ「ループエンジニアリング」が出てきたのか？
**「人間がプロンプトを打つ作業が、最大のボトルネックになったから」** です。

従来の開発スタイルでは、人間が指示を出し、AI がコードを書き、人間がエラーを確認して、人間が「直して」とプロンプトを打ち直す……という **1問1答のピンポン（オペレーター作業）** が繰り返されていました。

AI が進化して自分でコマンドを叩き、ファイルを読み書きできるようになった現在、人間が間に入って手動でプロンプトを仲介していては、作業が止まり人間も疲弊してしまいます。

### 簡単に言うとどういうことか？
**「人間が AI を直接操縦するのをやめて、AI が自分で走るための『レールとフィードバック環境』を整えること」** です。

人間の役割は「プロンプト（指示文）を書く人」から、**「AI が自分でテストし、自分で直して、ゴールまで自律完走する仕組み（ループ）を設計する人」** へとシフトしています。

---

## ループエンジニアリングとは何か（Addy Osmani 氏の整理）

Google の Addy Osmani 氏は、エッセイ [『Loop Engineering』(2026-06-07)](https://addyosmani.com/blog/loop-engineering/) の中で、ループエンジニアリングを **「エージェントにプロンプトを打つ自分自身を、自動でプロンプトを実行するシステムへと置き換えること」** と定義しています。

以前議論されていた「Harness Engineering（ハーネス工学＝単一エージェントが動作する足場・サンドボックス・権限の設計）」に対し、ループエンジニアリングはその **1つ上の階層（one floor above the harness）** に位置します。

### ループを構成する「5つの基本要素 ＋ 外部メモリ」

Addy Osmani 氏は、製品（Antigravity、Claude Code、Codex app 等）の垣根を越えて、自律ループを成立させるための **5つの基本要素（Primitives）** と **1つの外部メモリ（Memory）** を整理しています。

| 構成要素 | ループ内での役割（Job in the loop） | 当環境（Antigravity / DevContainer）での実装 |
| :--- | :--- | :--- |
| **1. Automations（自動化）** | スケジュール実行・自律的なタスク探索とトリアージ | `/schedule` (Cron), `/plan` (ゴール駆動自律実行) |
| **2. Worktrees（並行隔離）** | 複数エージェント作業の衝突を防ぐ環境分離 | `git worktree`, サブエージェントのブランチ分離 |
| **3. Skills（スキル）** | プロジェクト固有の手順・知識をオンデマンド提供 | Agent Skills（`.agents/skills/*/SKILL.md`） |
| **4. Plugins / Connectors** | エージェントを日常の開発ツール・API と接続 | MCP（GitHub MCP, ファイル操作, コマンド実行） |
| **5. Sub-agents（サブエージェント）** | 一方が実装（Maker）し、他方が検査（Checker） | `invoke_subagent` によるタスク・レビューの分離 |
| **+ Memory（外部記憶）** | セッションを跨いで知見と進捗を永続化 | **`Learnings.md`** / `AGENTS.md` |

Addy 氏が **「The agent forgets, the repo doesn't（エージェントは忘れるが、リポジトリは忘れない）」** と強調するように、LLM のコンテキストウィンドウの外側（ディスク上）に状態を逃がして引き継ぐことが、自律ループを継続させる最大の秘訣です。

---

## プロンプトから「自律ループ」へのパラダイムシフト

従来のプロンプトエンジニアリングは、「人間が AI と対話しながら 1 問 1 答で出力を調整する」作業でした。しかし、自律型エージェントの時代において、人間の役割は **「エージェントが自律的に走り続けられるフィードバック環境と制御ループを整えること」** へとシフトしています。

