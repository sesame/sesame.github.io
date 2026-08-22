---
date: '2026-08-16T11:28:00Z'
draft: false
title: 'Hugo で Asciidoctor をコンテナ連携させて動かす構成メモ'
description: 'Hugo で AsciiDoc を使う際、メインの開発環境に Ruby や Gem を直接インストールせず、Docker コンテナ + CLI ラッパーで透過的に呼び出す構成の実装手順と並行ビルド対策メモ。'
tags: ["hugo", "asciidoc", "asciidoctor", "docker", "devcontainers", "ruby"]
categories: ["Tech", "Architecture"]
---

## はじめに

Hugo で AsciiDoc（`.adoc`）を HTML に変換する場合、Ruby 製の `asciidoctor` コマンドが必要です。

しかし、Go メインの開発環境や DevContainer に Ruby や Bundler、Rouge などの Gem を直接追加したくなかったため、**「Asciidoctor を専用コンテナに切り出し、CLI ラッパースクリプトで透過的に呼び出す」** 構成を組んだときの技術メモです。

---

## 全体構成とアーキテクチャ

Hugo から見るとローカルの `asciidoctor` コマンドを呼んでいるだけですが、実際にはラッパースクリプトが `docker run` を経由してコンテナ内でパース処理を行います。

```text
Hugo (Go / DevContainer)
  │ (1) asciidoctor を実行 (stdin で .adoc を渡す)
  ▼
ラッパースクリプト (~/.local/bin/asciidoctor)
  │ (2) 排他制御 (flock) ＋ stdin をコンテナに流し込む
  ▼
Asciidoctor 専用コンテナ (Ruby + Rouge)
  │ (3) HTML に変換して標準出力へ返す
```

---

## 構築手順

### Dockerfile と Gemfile の準備

`Dockerfile.asciidoctor`:
```dockerfile
FROM ruby:3.4-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /converter
COPY Gemfile* ./
RUN bundle install

ENTRYPOINT ["bundle", "exec", "asciidoctor"]
```

`Gemfile`:
```ruby
source 'https://rubygems.org'

gem 'asciidoctor', '~> 2.0'
gem 'rouge', '~> 4.0'
```

イメージをビルドします。

```bash
docker build -t adoc_converter:latest -f Dockerfile.asciidoctor .
```

### ラッパースクリプトの配置と並行ビルド対策

Hugo は複数ページを高速に並行ビルドするため、素朴な `docker run` ラッパーでは **「標準入出力パイプの競合・切断による 0 bytes 出力エラー」** が発生します。

これを防止するため、一時ファイルへの読み込みと `flock` による排他制御を組み込みます。

`~/.local/bin/asciidoctor`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Hugo 側のタイムアウトを防ぐため、ロック取得前に標準入力を即座に一時ファイルへ読み切る
TMP_INPUT=$(mktemp)
TMP_OUTPUT=$(mktemp)
trap 'rm -f "$TMP_INPUT" "$TMP_OUTPUT"' EXIT

cat > "$TMP_INPUT"

# 2. 入力が 0 bytes の場合はコンテナを起動せず即座に終了
if [[ ! -s "$TMP_INPUT" ]]; then
  exit 0
fi

# 3. docker run の実行部分のみを flock で排他制御（直列化）
(
  flock -x 200
  docker run --rm -i \
    -v "$TMP_INPUT:/tmp/input.adoc:ro" \
    --entrypoint bundle \
    adoc_converter:latest \
    exec asciidoctor -o - "$@" /tmp/input.adoc > "$TMP_OUTPUT"
) 200>/tmp/asciidoctor_build.lock

cat "$TMP_OUTPUT"
```

実行権限を付与：

```bash
chmod +x ~/.local/bin/asciidoctor
```

### Hugo の設定 (`hugo.toml`)

Hugo が外部コマンドとして `asciidoctor` を呼べるようにセキュリティ設定で許可します。

```toml
[security.exec]
  allow = ['^asciidoctor$', '^go$', '^git$']
```

---

## 運用のメリット

- **メイン環境の保全**: Ruby や各種 Gem がメインの開発環境（DevContainer）に入らず、依存関係の衝突を防げる。
- **バージョンの固定**: Docker イメージ内にツールチェーンが固定されているため、ローカルと CI 間でのビルド差異が起きない。
- **高速性と安全性の両立**: 排他制御により、並行ビルド時のパイプ切断エラーを確実に防止。

> ※ 本記事の構成検討・技術仕様の検証・Hugo による静的ビルド検証・推敲は、AI コーディングエージェントとの自律協働ループによって執筆・検証されています。
