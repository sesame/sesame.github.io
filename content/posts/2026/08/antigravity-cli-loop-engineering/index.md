---
date: '2026-08-17T02:40:00Z'
draft: false
title: 'Antigravity CLI で実践する自律実行ループ設計（ループエンジニアリング）'
description: 'AIコーディングエージェントを自律走行させるための環境設計論。なぜループが必要なのか、その本質とAddy Osmani氏の5要素モデル、Learnings.mdによる2層メモリ構造、Dev Containersを用いた5ステップ完全実践ハンズオンガイド。'
tags: ["antigravity", "agent", "loop-engineering", "harness-engineering", "ai", "cli", "learnings", "devcontainers"]
categories: ["Tech", "AI Development"]
---

AIコーディングエージェント（Antigravity、Claude Code、Cursor 等）の活用において、今まさに大きなパラダイムシフトが起きています。

PSPDFKit 創業者のピーター・スタインバーガー（Peter Steinberger）氏は、次のように述べました。

> 「コーディングエージェントに直接指示を与えるべきではない。エージェントに指示を与えるループを設計すべきだ」
> — Peter Steinberger (Founder, PSPDFKit)

同様に、Anthropic 社で Claude Code の開発を率いるボリス・チェルニー（Boris Cherny）氏も語っています（[Acquired Unplugged presented by WorkOS, 2026-06-02](https://www.youtube.com/watch?v=RkQQ7WEor7w)）。

> 「私はもう、Claude に直接指示を与えていません。Claude に指示を与え、何をすべきかを判断させるループを実行しています。私の仕事は **『ループ（仕組み）』** を書くことです。」
> — Boris Cherny (Head of Claude Code, Anthropic)

---

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

```text
+-------------------------------------------------------------------------+
| [Loop Engineering] ループ制御系                                         |
|  - タイマー駆動、サブエージェント生成、タスクの自己供給・反復サイクル        |
+-------------------------------------------------------------------------+
                                    │ （ハーネスの上で動作）
                                    ▼
+-------------------------------------------------------------------------+
| [Harness Engineering] エージェントの足場・実行環境                       |
|  - サンドボックス（コンテナ）、権限設定、ツール接続、検証スクリプト          |
+-------------------------------------------------------------------------+
```

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

```text
【従来の 1問1答（人間がループの結節点）】
  人間（プロンプト） ──► AI（コード生成） ──► 人間（エラー確認） ──► 人間（修正指示） ──► ...

【ループエンジニアリング（人間は外側の設計者）】
  人間（ゴール定義）
    │
    ▼
  [ 自律ループ制御システム (Loop) ]
    │  - Plan → Action → Observe → Fix を自動反復
    │  - エラーが出ても自力でテスト・自己修復
    │  - Maker-Checker パターンによる品質検証
    ▼
  人間（最終成果物のレビューとマージ）
```

---

## インナーループ（実行と自己修復）の仕組み

インナーループは、エージェントが目標に向かって自律的に繰り返す最小単位の実行サイクルです。

```text
[1. Plan (思考・計画)]
  │
  ▼
[2. Action (ツール実行)]
  │  (view_file / replace_file_content / run_command)
  │
  ▼
[3. Observe (実行結果の観測)]
  │  (Exit Code / Stdout / Stderr / Linter)
  │
  ├──► [成功] ──► 終了（ゴール達成）
  │
  └──► [失敗 / エラー検知]
         │
         ▼
       [4. Reflect & Fix (自己分析・修正コード生成)]
         │
         └────────► [1. Plan] へ戻り再試行
```

Boris Cherny 氏が強調するように、自律エージェントの品質を決める最重要要素は **「エージェント自身が自分の成果物を検証（Verify）できる手段を与えること」** です。

---

## メタ改善ループ（知見の永続化と歴史的背景）

エージェントはセッションが終了するとメモリがリセットされます（ステートレス性の壁）。過去の試行錯誤や環境固有の癖を外部記憶（Durable State）として永続化するのが **メタ改善ループ** です。

### `Learnings.md` の発祥と進化の歴史

なぜ単一のルールファイルではなく、`Learnings.md` という独立した知見ファイルを使うのか。これにはAIコーディングツールの進化の経緯があります。

```text
第1期（2024〜2025初頭）: .cursorrules の一枚岩運用
  └─ エラー対策を全部詰め込んでルールが長大化 → コンテキスト肥大化（Context Bloat）

第2期（2025半ば）: Boris Cherny 氏の「反省ループ（Lessons Learned）」
  └─ 人間が書くのではなく、AI自身に反省をまとめさせて次へ引き継ぐ思想

第3期（2025秋）: Agent Skills と Learnings.md の OSS デファクト化
  └─ wrap-up や self-improvement スキルで Learnings.md という命名が定着

第4期（現在 / 2026）: 「2層メモリ構造」とゼロプロンプト自己進化
  └─ 憲法（AGENTS.md）と判例集（Learnings.md）の分離・自律記録
```

#### `.cursorrules` 時代の一枚岩とコンテキスト肥大化の罠
2024年、Cursor や GitHub Copilot の普及とともに `.cursorrules` や `copilot-instructions.md` が登場しました。当初は「AIへの指示はすべて1つのファイルに書く」という運用が一般的でした。

しかし、開発が進むにつれてエラー対策やライブラリの仕様を次々と追記した結果、**ルールファイルが数百〜数千行に膨れ上がり、プロンプトのトークンを激しく浪費して AI の回答精度が逆に低下する「Context Bloat（コンテキスト圧迫）」** に直面しました。

#### Boris Cherny 氏の反省ループ思想
2025年半ば、Boris Cherny 氏が「人間がルールを手書きするのではなく、**AI自身にセッションごとの反省（Lessons Learned）をまとめさせ、ファイルに記録させて次回のセッションに引き継ぐ仕組み**」を提唱しました。

#### Agent Skills 登場と `Learnings.md` のデファクト化
2025年10月に Anthropic から [Agent Skills](https://github.com/anthropics/anthropic-quickstarts) の仕様が登場すると、OSS コミュニティで `self-improvement` や `wrap-up` スキルが急速に開発されました。反省ログを書き込むファイル名として **`Learnings.md`**（または `.learnings/LEARNINGS.md`）が広く採用され、業界の標準となりました。

### 現在の標準「2層メモリ構造（Memory Layering）」

現在では、エージェント向けの知識を以下の **2層** に分離して管理するのがベストプラクティスです。

| ファイル | 役割・性質 | メンテナンス方針 |
| :--- | :--- | :--- |
| **`AGENTS.md` / `CLAUDE.md`**（憲法・基本法） | 常に適用される普遍的で短い行動指針・禁止事項 | **短く最小限に維持**（コンテキストを圧迫しないよう数十行以内） |
| **`Learnings.md`**（判例集・知見庫） | 日々のエラー解決、ライブラリの癖、環境トラブルのログ | **高頻度で自律蓄積**（エージェントが必要に応じて追記・参照） |

---

## 自律ループ環境を構築する 5 つのステップ

「理論はわかったが、実際に自分のリポジトリで自律ループを回すには何をすればいいのか？」という方向けの、**コピペで構築できる 5 ステップ実践ガイド** です。

### Step 1: サンドボックス（Dev Containers）を用意する

ホスト OS 上でエージェントを直接動かすと、誤操作への恐れから「確認プロンプト（承認待ち）」を外せなくなります。
プロジェクトルートに `.devcontainer/devcontainer.json` を作成し、壊れても安全な隔離空間を用意します。

```jsonc
{
  "name": "My Project DevContainer",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "remoteUser": "vscode",
  // AIエージェントのキャッシュや設定をボリュームマウントで永続化
  "mounts": [
    "source=agy-data,target=/home/vscode/.gemini/antigravity-cli,type=volume"
  ],
  // ホストの環境変数を安全に注入
  "remoteEnv": {
    "GITHUB_TOKEN": "${localEnv:GITHUB_TOKEN}"
  }
}
```

これで「どれだけ破壊されても 1 秒で再構築できる」状態になり、安心してエージェントにフル権限を委譲できます。

---

### Step 2: 自律動作ポリシー（`AGENTS.md`）を配備する

プロジェクトルートに `AGENTS.md` を作成します。
エージェントが「軽微な判断で作業を止めないこと」と「学んだ知見を自発的に記録すること」を明記します。

```markdown
# 自律動作ポリシー
- **自律完遂**: 軽微な実装判断やテストエラーの修復は、ユーザーに都度確認せず自律的に進める。破壊的変更（ファイル破棄や強制プッシュ等）のみ確認を行う。
- **自己進化**: 新たなトラブル解決や環境固有の仕様・ノウハウを発見した際は、ユーザーの指示を待たずに自発的に `Learnings.md`（および必要に応じて本 `AGENTS.md`）へ追記・更新してタスクを完了する。

# プロジェクト固有ルール
- コミットメッセージは Conventional Commits 形式に従う。
- テスト実行後は必ず `npm test` または `hugo --cleanDestinationDir` で検証する。
- 過去のトラブルシューティングは `Learnings.md` を参照する。
```

---

### Step 3: パーミッション（`settings.json`）を摩擦ゼロにする

コマンドを実行するたびに確認ダイアログ（Tool Confirmation）が出ると、自律ループが停止します。
`~/.gemini/antigravity-cli/settings.json` の `permissions.allow` に日常操作を登録し、摩擦をゼロにします。

```json
{
  "permissions": {
    "allow": [
      "command(npm test*)",
      "command(npm run*)",
      "command(hugo*)",
      "command(git status)",
      "command(git diff)",
      "command(git log)",
      "command(git add)",
      "command(git commit)",
      "command(cat)",
      "command(grep)",
      "command(ls)",
      "command(mkdir)"
    ]
  }
}
```

---

### Step 4: 高速な検証コマンド（Fast Observability）を整備する

エージェントが「コード変更が正しかったか」を即座に判定できるよう、検証スクリプトを整備します。

#### 要件チェックリスト
1. **数秒で完了する**: 1 回のテストに何分もかかると自己修復ループが鈍化します。
2. **明確な Exit Code**: 失敗時は必ず `exit 1` などの非ゼロを返します。
3. **失敗箇所が明確なエラー出力**: スタックトレースや具体的なエラー行を標準エラー出力（stderr）に出します。

`package.json` の例：
```json
{
  "scripts": {
    "test:fast": "vitest run --bail 1",
    "lint:check": "eslint . --max-warnings 0"
  }
}
```

---

### Step 5: 実際にループを回す（コマンドとワークフロー）

環境が整ったら、Antigravity CLI（`agy`）を起動してタスクを実行します。

#### ① ゴール駆動自律実行（`/plan`）
Claude Code の `/goal` のように、大きな目的を渡して自律完走させます。

```text
/plan 新規ユーザー登録APIのエンドポイントを実装し、テストを通過させてコミットまで完了してください
```

エージェントは自動的に計画（Checklist）を作成し、ファイル作成 → テスト実行 → エラー自己修復 → コミットまでを確認プロンプトなしで完走します。

#### ② 定期実行・監視ループ（`/schedule`）
Claude Code の `/loop` のように、定期的にエージェントを駆動させます。

```text
/schedule CronExpression="*/5 * * * *" Prompt="未処理のエラーログがないか監視し、検知した場合は原因調査と修正PRを作成してください"
```

#### ③ セッション終了時の自己進化（`/learn` または自動記録）
タスク完了後、エージェントは `AGENTS.md` のポリシーに従って自動で `Learnings.md` に知見を追記します。明示的に指示したい場合は `/learn` コマンドを実行します。

```text
/learn 今回のセッションで得られた知見を Learnings.md に記録して
```

---

## 自律ループを支える設計パターン

### Maker-Checker パターン（生成と検証の分離）
単一のエージェントに「コード作成」と「自己レビュー」を同時にやらせると、自身のバイアスでバグを見落としがちです。
実装を行うエージェント（Maker）と、独立したコンテキストでテストや規約違反を検査するエージェント（Checker）を分離することで、ループの信頼性が大幅に向上します。

### サブエージェントによるコンテキスト階層化
1つの会話スレッドで長大な試行錯誤を続けると、初期の指示を見失う **Context Drift（文脈崩壊）** が起きます。
調査特化（Research）、実装特化（Branch Refactor）、レビュー特化（Review）のサブエージェントにタスクを切り出し、親エージェントには「要約結果」だけを戻すことで、メインコンテキストを常にクリーンに保ちます。

---

## 実践例：当ブログ環境における自律ループ

当ブログ環境（Hugo + Markdown + Antigravity）での実際の自律ループの流れです。

```text
1. [User] "記事のトーンを脱AI化して、歴史的背景と5ステップハンズオンを組み込んで"
   │
   ├──► 2. [Action] 記事ファイルの修正と関連リンクの更新
   │
   ├──► 3. [Observe] `hugo --cleanDestinationDir` を実行
   │      - ビルド成功（所要時間1.3秒）を確認
   │
   ├──► 4. [Observe] 未使用となった旧テーマディレクトリを検知
   │      - `themes/hugo-coder` や `themes/blowfish` を自律的に削除
   │
   └──► 5. [Meta Learning Loop: Zero-Prompt Evolution]
          - 得られた知見（執筆トーン方針）を `Learnings.md` へ自動記録
          - タスク完了報告
```

人間が「テストして」「ゴミを消して」「学びを書いて」と逐一指示しなくても、エージェントが自律的にインナーループとメタ改善ループを完走します。

---

## よくあるアンチパターンと対策

| アンチパターン | 発生する問題 | 対策 |
| :--- | :--- | :--- |
| **指示プロンプトの過剰装飾** | 長文指示で制約違反や指示見落としが発生 | プロンプトは簡潔にし、制約は `AGENTS.md` とテストスクリプトに任せる |
| **確認プロンプトの放置** | 1コマンドごとに承認待ちになりループが停止 | `settings.json` の `permissions.allow` に日常コマンドを事前登録 |
| **知見のルールファイル直書き** | `AGENTS.md` が肥大化してトークン圧迫・精度低下 | 憲法（`AGENTS.md`）と判例集（`Learnings.md`）の2層に分離 |
| **重すぎるテストスイート** | 1回の自己修復に数分かかりループが鈍化 | 失敗が即座にわかる軽量テスト（`--bail` 等）を用意する |
| **単一コンテキストでの長期試行** | コンテキスト肥大化で推論精度が急落 | サブエージェントを活用して調査・実装ループを階層化する |

---

## 参考リンク・情報ソース

- [Addy Osmani: Loop Engineering (2026-06-07)](https://addyosmani.com/blog/loop-engineering/)
- [Anthropic Quickstarts: Agent Skills Specification](https://github.com/anthropics/anthropic-quickstarts)
- [Acquired Unplugged (WorkOS): Boris Cherny on Claude Code and Agent Loops (2026-06-02)](https://www.youtube.com/watch?v=RkQQ7WEor7w)

---

## 関連記事

- [Copilot・Cursor・Antigravity のカスタム指示ファイル設定まとめ](/posts/2026/08/ai-coding-rules-comparison/)
- [Agent Skills の仕様と書き方メモ：手順書（Runbook）のオンデマンド読み込み](/posts/2026/08/agent-skills-introduction/)
- [Dev Containers による開発環境のコード化と Hugo + AIエージェント構成例](/posts/2026/08/devcontainers-introduction/)
- [Model Context Protocol（MCP）の仕組みと設定方法メモ](/posts/2026/08/mcp-introduction/)
