---
date: '2026-08-16T11:25:00Z'
draft: false
title: 'Dev Containers による開発環境のコード化と Hugo + AIエージェント構成例'
description: 'VS Code の Dev Containers を使ってチーム共通の開発環境をコード化する手順。devcontainer.json の書き方と、Hugo + Antigravity CLI を動かす構成例メモ。'
tags: ["docker", "devcontainers", "vscode", "hugo", "environment"]
categories: ["Tech", "DevOps"]
---

## はじめに

ローカルマシンの環境汚染を防ぎ、チーム全員で同一のツールチェーンを共有するために、VS Code の **Dev Containers** を採用しています。

本記事では、`.devcontainer/` の基本設定と、当ブログで運用している Hugo ＋ AI コーディングエージェント（Antigravity）向けの構成例をまとめます。

---

## Dev Containers の基本構成

プロジェクトルートに `.devcontainer/` ディレクトリを作成し、設定ファイルを配置します。

```text
.devcontainer/
├── devcontainer.json   # メイン設定ファイル
├── Dockerfile          # ベースイメージ定義
└── post-create.sh      # コンテナ生成後の初期化スクリプト
```

### `devcontainer.json` の設定例

```jsonc
{
  "name": "Hugo & AI Agent DevContainer",
  "build": {
    "context": ".",
    "dockerfile": "./Dockerfile"
  },
  "remoteUser": "vscode",
  // ホスト上の名前付きボリュームで AI エージェントのデータを永続化
  "mounts": [
    "source=agy-data,target=/home/vscode/.gemini/antigravity-cli,type=volume"
  ],
  // ホストの環境変数をコンテナ内へ注入
  "remoteEnv": {
    "GITHUB_TOKEN_BLOG": "${localEnv:GITHUB_TOKEN_BLOG}"
  },
  // コンテナ内から Docker コマンドを使えるようにする
  "features": {
    "ghcr.io/devcontainers/features/docker-outside-of-docker:1": {}
  },
  "postCreateCommand": "bash .devcontainer/post-create.sh"
}
```

---

## 初期化スクリプト (`post-create.sh`)

コンテナ起動時に必要な CLI ツールを自動でセットアップします。

```bash
#!/bin/bash
set -e

# Hugo Extended の最新版をインストール
if ! command -v hugo >/dev/null 2>&1; then
  CGO_ENABLED=1 go install -tags extended github.com/gohugoio/hugo@latest
fi

# 記事作成スクリプトの配置
mkdir -p /home/vscode/.local/bin
cat << 'EOF' > /home/vscode/.local/bin/new-post
#!/usr/bin/env bash
SLUG="$1"
EXT="${2:-md}"
YEAR=$(date +%Y)
MONTH=$(date +%m)
hugo new "posts/${YEAR}/${MONTH}/${SLUG}/index.${EXT}"
EOF
chmod +x /home/vscode/.local/bin/new-post
```

---

## 設定時の設計ポイント

1. **Dev Container Features の活用**: Node.js や Docker in Docker などの追加ツールは、`Dockerfile` で自前ビルドするより Dev Container Features を指定する方がメンテナンス性に優れます。
2. **データの永続化（Named Volume）**: コンテナを再構築してもキャッシュや AI エージェントのログデータを残したい場合は、`mounts` で Named Volume を割り当てます。
3. **一般ユーザーでの実行（権限分離）**: `remoteUser: "vscode"` を指定し、ホスト側のファイル権限が root で汚染されるのを防ぎます。

> ※ 本記事の構成検討・技術仕様の検証・Hugo による静的ビルド検証・推敲は、AI コーディングエージェントとの自律協働ループによって執筆・検証されています。

---

## 参考リンク・情報ソース

- [Development Containers: Open specification for container development (containers.dev)](https://containers.dev)
- [devcontainer.json reference (containers.dev)](https://containers.dev/implementors/json_reference/)
- [Dev Container Features (containers.dev)](https://containers.dev/features)
