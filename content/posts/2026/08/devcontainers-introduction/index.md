---
date: '2026-08-16T11:25:00Z'
draft: false
title: 'Dev Containers 実践ガイド：Hugo ＋ 自律 AI エージェントを安全に走らせるコンテナ環境設計'
description: 'VS Code の Dev Containers を使って Hugo 静的サイト生成環境と自律 AI エージェント（Antigravity CLI）を完全分離・自動セットアップする実践手順。Docker-outside-of-Docker、Named Volume によるエージェント記憶の永続化、Features 活用の設計パターンを解説。'
tags: ["docker", "devcontainers", "vscode", "hugo", "antigravity", "ai", "environment"]
categories: ["Tech", "DevOps"]
---

## はじめに

モダンな Web 開発や静的サイト（Hugo 等）の運用では、Go ランタイム、Node.js / npm、Dart Sass、画像最適化ツール、さらには CI/CD 連携スクリプトなど、多種多様なツールチェーンが要求されます。

これらをチームメンバー全員のマシンで同一バージョンに揃え、さらに **「自律的にコマンドを実行する AI コーディングエージェント」** を安全に稼働させるにはどうすればよいでしょうか？

本記事では、VS Code の **Dev Containers（Development Containers）** を用いて、Hugo ブログ開発環境と自律 AI エージェント（Google Antigravity CLI 等）をコード化し、完全分離されたサンドボックスとして構築・運用する実践的な設計パターンを整理します。

---

## チーム開発と AI 協働が直面した「環境の二重苦」

開発環境の構築において、私たちは 2 つの大きな課題に直面していました。

### 1. 複雑化するツールチェーンと環境差異
Hugo の Extended 版は CGO（C 言語バインディング）や Dart Sass（SCSS トランスパイル）を要求し、さらに Asciidoctor や各種プラグインを組み合わせると、ローカルホスト上で依存関係が衝突しやすくなります。「ローカルではビルドできたのに、GitHub Actions の CI ではコケる」という問題の原因の多くは、この環境差異にありました。

### 2. AI エージェントの自走に伴う「ホスト破壊のリスク」
AI コーディングエージェントに「エラーが出たら自力で修正してビルドを再検証する自律ループ」を任せる場合、ホスト OS 上で直接コマンドを実行させるのは危険を伴います。プロンプトの不備や確率的な誤判断によって、ホスト上の重要な設定ファイルやリポジトリ外のファイルが誤って操作されるリスクがあるためです。

```text
[ 課題の構造 ]
1. 人間の課題: 複雑なツールチェーンによる「私のマシンでは動かない」問題
2. AI の課題 : フル権限を与えられないことによる「確認待ちの多発（自律性の停止）」
       │
       ▼ (解決策)
[ Dev Containers による物理サンドボックス化 ]
```

---

## Dev Containers のアーキテクチャと基本構造

Dev Containers は、プロジェクトルート直下の `.devcontainer/` ディレクトリに設定ファイルを配置することで機能します。

```text
.devcontainer/
├── devcontainer.json   # 【必須】VS Code およびコンテナの総合定義ファイル
├── Dockerfile          # 【任意】ベースイメージのカスタマイズ定義
└── post-create.sh      # 【任意】コンテナ初回生成時に実行される初期化スクリプト
```

### クライアント / サーバー分離の仕組み

VS Code はコンテナを起動すると、コンテナ内部に軽量な **`VS Code Server`** を自動注入します。

```text
+-----------------------------------------------------------------------+
| ホスト OS (macOS / Linux / Windows)                                   |
|   VS Code Client（UI 描画、キー入力、テーマ表示）                     |
+-----------------------------------------------------------------------+
                                │
                                │ (IPC / SSH 接続)
                                ▼
+-----------------------------------------------------------------------+
| Docker コンテナ (DevContainer)                                        |
|   VS Code Server（プロセス管理、ファイル監視）                        |
|   ├── Hugo Extended (Go ランタイム)                                   |
|   ├── Dart Sass (SCSS コンパイラ)                                     |
|   ├── AI エージェント (Antigravity CLI / 実行ループ)                  |
|   └── 拡張機能・デバッガ・言語サーバー (LSP)                          |
+-----------------------------------------------------------------------+
```

ホスト側の拡張機能や設定に依存せず、**コンテナ内部に閉じた完全にクリーンな開発空間** が立ち上がります。

---

## 実践：Hugo ＋ AI エージェント向け `devcontainer.json` の設計

当ブログで実際に運用している設定の全体像と、各設定項目の設計思想です。

```jsonc
{
  "name": "Hugo & AI Agent DevContainer",
  "build": {
    "context": ".",
    "dockerfile": "./Dockerfile"
  },
  "remoteUser": "vscode",

  // 1. AI エージェントの知見・セッションデータを名前付きボリュームで永続化
  "mounts": [
    "source=antigravity-cli-data,target=/home/vscode/.gemini/antigravity-cli,type=volume"
  ],

  // 2. ホスト側の環境変数（GitHub トークン等）をコンテナ内へ安全に注入
  "remoteEnv": {
    "GITHUB_TOKEN_BLOG": "${localEnv:GITHUB_TOKEN_BLOG}"
  },

  // 3. Dev Container Features による機能のモジュール追加
  "features": {
    // コンテナ内からホストの Docker デーモンを安全に操作（Docker-outside-of-Docker）
    "ghcr.io/devcontainers/features/docker-outside-of-docker:1": {
      "moby": false
    },
    // Node.js ランタイム
    "ghcr.io/devcontainers/features/node:1": {
      "version": "22"
    }
  },

  // 4. コンテナ内で自動有効化する VS Code 拡張機能
  "customizations": {
    "vscode": {
      "extensions": [
        "golang.go",
        "esbenp.prettier-vscode",
        "asciidoctor.asciidoctor-vscode",
        "GitHub.copilot"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "terminal.integrated.defaultProfile.linux": "bash"
      }
    }
  },

  // 5. 初回コンテナ作成時にツールを自動セットアップ
  "postCreateCommand": "bash .devcontainer/post-create.sh",

  // 6. ポートフォワーディング（Hugo ローカルサーバー）
  "forwardPorts": [1313]
}
```

---

## 重要設計パターン（永続化・二重コンテナ・権限分離）

### 1. Named Volume による「AI エージェント記憶」の永続化

コンテナは原則として「使い捨て（Stateless）」ですが、AI エージェントが学習した知見、会話ログ、認証セッション情報までコンテナ再構築のたびに消えてしまうと作業が中断されます。

```jsonc
"mounts": [
  "source=antigravity-cli-data,target=/home/vscode/.gemini/antigravity-cli,type=volume"
]
```

`mounts` 設定でホスト上の **Named Volume（名前付きボリューム）** を割り当てることで、コンテナを何度再構築（Rebuild）しても、エージェントのログやセッションデータが安全に引き継がれます。

### 2. Docker-outside-of-Docker（二重コンテナ連携）

Hugo のビルド時に Asciidoctor などの外部ランタイムを専用コンテナで動かしたい場合、DevContainer 内部から Docker コマンドを実行できる必要があります。

Dev Container Features の **`docker-outside-of-docker`** を指定することで、コンテナ内部の Docker CLI がホストマシンの Docker デーモン（`/var/run/docker.sock`）と透過的に通信できるようになります。

### 3. 一般ユーザー（`vscode`）実行によるファイル権限汚染の防止

コンテナを `root` ユーザーのまま動かすと、コンテナ内で作成・変更されたファイルの所有者が `root` になり、ホスト側で編集や Git 操作ができなくなる「パーミッション汚染問題」が発生します。

`devcontainer.json` で `"remoteUser": "vscode"` を指定し、非 root ユーザーでプロセスを動かすことが鉄則です。

---

## 初期化スクリプト (`post-create.sh`) の実装例

コンテナ起動直後に、Hugo Extended や補助 CLI ツールを自動でセットアップします。

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== DevContainer Post-Create Setup ==="

# 1. Hugo Extended のインストール（未導入の場合）
if ! command -v hugo >/dev/null 2>&1; then
  echo "Installing Hugo Extended..."
  CGO_ENABLED=1 go install -tags extended github.com/gohugoio/hugo@latest
fi

# 2. 記事作成ショートカット CLI の配置
mkdir -p /home/vscode/.local/bin
cat << 'EOF' > /home/vscode/.local/bin/new-post
#!/usr/bin/env bash
set -euo pipefail
SLUG="${1:-}"
if [[ -z "$SLUG" ]]; then
  echo "Usage: new-post <slug>" >&2
  exit 1
fi
YEAR=$(date +%Y)
MONTH=$(date +%m)
hugo new "posts/${YEAR}/${MONTH}/${SLUG}/index.md"
echo "Created: blog/content/posts/${YEAR}/${MONTH}/${SLUG}/index.md"
EOF
chmod +x /home/vscode/.local/bin/new-post

echo "✓ Post-Create Setup Completed Successfully."
```

---

## まとめ

- **再現性と独立性**: 複雑な Hugo ＋ Web 開発ツールチェーンを `.devcontainer/` にコード化し、環境差異をゼロに。
- **AI 自律ループの解放**: OS レベルの物理サンドボックスにより、AI エージェントに安全な自走権限（ノンブロッキング実行）を付与。
- **持続的な運用設計**: Named Volume によるエージェント記憶の永続化と、非 root ユーザー実行による権限汚染防止を両立。

> ※ 本記事の構成検討・技術仕様の検証・Hugo による静的ビルド検証・推敲は、AI コーディングエージェントとの自律協働ループによって執筆・検証されています。

---

## 参考リンク・情報ソース

- [Development Containers: Open Specification (containers.dev)](https://containers.dev)
- [devcontainer.json Reference (containers.dev)](https://containers.dev/implementors/json_reference/)
- [Dev Container Features Registry (containers.dev)](https://containers.dev/features)
- [Hugo Documentation: Installation (gohugo.io)](https://gohugo.io/installation/)
