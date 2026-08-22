---
date: '2026-08-16T11:28:00Z'
draft: true
title: 'Hugo で Asciidoctor をコンテナ連携させて動かす構成メモ'
description: 'Hugo で AsciiDoc を使う際、メインの開発環境に Ruby や Gem を直接インストールせず、Docker コンテナ + CLI ラッパーで透過的に呼び出す構成の実装手順とメモ。'
tags: ["hugo", "asciidoc", "asciidoctor", "docker", "devcontainers", "ruby"]
categories: ["Tech", "Architecture"]
---

Hugo で AsciiDoc（`.adoc`）を HTML に変換する場合、Ruby 製の `asciidoctor` コマンドが必要です。

しかし、Go メインの開発環境や DevContainer に Ruby や Bundler、Rouge などの Gem を直接入れたくなかったため、**「Asciidoctor を専用コンテナに切り出し、CLI ラッパースクリプトで透過的に呼び出す」** 構成を組んだときのメモです。

---

## 全体構成

Hugo から見るとローカルの `asciidoctor` コマンドを呼んでいるだけですが、実際にはラッパースクリプトが `docker run` を経由してコンテナ内でパース処理を行います。

```text
Hugo
  │ (1) asciidoctor を実行
  ▼
ラッパースクリプト (~/.local/bin/asciidoctor)
  │ (2) stdin をコンテナに流し込み、stdout を受け取る
  ▼
Asciidoctor 専用コンテナ (Ruby + Rouge)
  │ (3) HTML に変換して標準出力へ
```

---

## 構築手順

### 1. Dockerfile と Gemfile の準備

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

### 2. ラッパースクリプトの配置

パスの通った場所（`~/.local/bin/asciidoctor`）にスクリプトを作成します。

```bash
#!/usr/bin/env bash
# 標準入力・引数をコンテナへ中継
exec docker run --rm -i --entrypoint bundle adoc_converter:latest exec asciidoctor "$@"
```

実行権限を付与：

```bash
chmod +x ~/.local/bin/asciidoctor
```

標準入力を受け取るため、`docker run` に `-i` を付けるのがポイントです。

### 3. Hugo の設定 (`hugo.toml`)

Hugo が外部コマンドとして `asciidoctor` を呼べるように許可します。

```toml
[security.exec]
  allow = ['^asciidoctor$', '^go$', '^git$']
```

---

## メリット

- **メイン環境が汚れない**: Ruby や各種 Gem がメインのコンテナ/ホストに入らない。
- **バージョンの固定**: Docker イメージ内に閉じているため、ローカルと CI 間での挙動差が起きない。
- **DevContainer との連携**: Docker-outside-of-Docker を有効にしておけば、DevContainer 内からでも同じように動く。

> ※ 本記事の構成検討・技術仕様の検証・Hugo による静的ビルド検証・推敲は、AI コーディングエージェントとの自律協働ループによって執筆・検証されています。

