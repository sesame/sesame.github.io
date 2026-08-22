---
date: '2026-08-22T08:50:00Z'
draft: false
title: 'Python 開発を効率化するモダンターミナル環境設計：Ghostty・fish・peco・ghq・tmux・Jujutsu・VS Code・Herdr・Hunk 連携'
description: 'Ghostty（GPU ターミナル）、fish、peco、ghq、tmux / herdr（セッション・AI エージェント管理）、Jujutsu（次世代 VCS）、hunk（TUI 差分レビュー）、VS Code を統合した、Python 開発と AI 協働のための最新ターミナル環境構築メモ。'
tags: ["python", "ghostty", "fish", "tmux", "ghq", "peco", "jujutsu", "vscode", "herdr", "hunk", "cli", "dev-environment"]
categories: ["Tech", "Development Environment"]
---

> [!NOTE] 個人用メモ・備忘録
> 日々の開発・インフラ検証の備忘録として残している個人ノートです。手元環境での動作ログをもとにまとめています。環境差異等もあるため、参考にされる場合はご自身の環境で検証の上ご活用ください。

## はじめに

複数の Python プロジェクト（FastAPI アプリ、CLI ツール、データ処理バッチ、ライブラリ等）を並行して開発する際、以下のような操作摩擦が積み重なり、作業の中断やコンテキストスイッチのコストを生み出します。

1. **ディレクトリ移動の手間**: 階層の深いプロジェクトパスを `cd` コマンドで手動入力する。
2. **バックグラウンドプロセスの消失**: ローカルサーバーやテスト監視、ワーカープロセスを起動したターミナルを閉じるとプロセスが終了してしまう。
3. **仮想環境（venv / uv）の切り替え忘れ**: プロジェクトを移動するたびに手動で activate する必要がある。
4. **Git のコミット・ブランチ操作の煩雑さ**: AI や人間による頻繁な試行錯誤（スクラップ＆ビルド）で、コミットログが汚れたりコンフリクト解消に工数がかかる。
5. **GUI エディタや差分レビューへの切り替えコスト**: ターミナルからエディタ（VS Code）や Git 差分確認画面への行き来に手間がかかる。

これらの課題を解消し、**「端末起動 ➔ リポジトリ選択 ➔ 仮想環境アクティベート ➔ セッション復元 ➔ 安全なバージョン管理・差分レビュー」までを一気通貫で高速化するターミナル駆動開発環境（Terminal-Driven Development Stack）** を構築します。

本記事では、**Ghostty**、**fish**、**peco**、**ghq**、**tmux / herdr**、**Jujutsu (jj)**、**hunk**、および **VS Code** を組み合わせた実践的な設計と設定方法を整理します。

---

## ツールスタックとそれぞれの役割（レイヤー構造）

開発環境を構成するツール群を、インフラ（端末）からアプリケーション（エディタ・VCS）までの階層で整理します。

```text
+------------------------------------------------------------------------+
| [Application Layer]                                                    |
|  - VS Code      : GUI エディタ / デバッグ / Dev Containers              |
|  - Jujutsu (jj) : 次世代 Git 互換 VCS（自動コミット / 完全 Undo）       |
|  - hunk         : Review-First TUI 差分レビュー / 部分ステージング     |
+------------------------------------------------------------------------+
| [Session & Agent Layer]                                                |
|  - tmux / herdr : セッション永続化 / Agent-Aware 状態管理              |
+------------------------------------------------------------------------+
| [Shell & Navigation Layer]                                             |
|  - fish         : オートサジェスト / 構文ハイライト / 関数フック       |
|  - ghq + peco   : リポジトリ一元配置 ＋ あいまい検索ジャンプ           |
|  - uv           : 高速 Python パッケージ管理 / 仮想環境自動連携        |
+------------------------------------------------------------------------+
| [Terminal Emulator Layer]                                              |
|  - Ghostty      : Zig 製・GPU 高速描画 / 低遅延 / ネイティブ UI         |
+------------------------------------------------------------------------+
```

### 各ツールの役割と導入メリット

| ツール | レイヤー | 単体での役割 | 導入後のメリット |
| :--- | :--- | :--- | :--- |
| **`Ghostty`** | ターミナル | GPU 描画ターミナルエミュレータ | 低遅延・高速レンダリング、ネイティブなタブ/画面分割、Kitty グラフィックス対応 |
| **`fish`** | シェル | 設定不要で賢いシェル | 過去履歴の予測補完（オートサジェスト）や構文エラー検知がプラグインなしで動作 |
| **`ghq`** | ナビゲーション | リポジトリ配置の自動統一 | `ghq get <URL>` で `~/ghq/github.com/...` に自動整理。置き場所の迷いを排除 |
| **`peco`** | ナビゲーション | 対話型インクリメンタルフィルタ | キーワード入力だけで大量の候補から瞬時に選択・決定 |
| **`tmux`** | セッション | ターミナルマルチプレクサ | ターミナルを閉じても裏でサーバーやテストが維持され、作業空間を丸ごと復元 |
| **`herdr`** | セッション | Agent-Aware マルチプレクサ | 各ペインで稼働する AI エージェントの状態（working / blocked / done）を自動検知 |
| **`Jujutsu (jj)`** | VCS | 次世代 Git 互換バージョン管理 | 作業コピーの自動コミット、全操作の `jj undo`、コンフリクトを恐れないスタック開発 |
| **`hunk`** | レビュー | Review-First TUI 差分ビューア | AI や自身が変更したコード差分をインラインで高速レビューし、行単位で安全にステージング |
| **`VS Code`** | エディタ | GUI エディタ / デバッグ | `code <path>` で CLI から瞬時に開き、GUI デバッガや Dev Containers と連携 |

---

## Ghostty：高速・低遅延な GPU ターミナル基盤

**Ghostty ([ghostty.org](https://ghostty.org))** は、Mitchell Hashimoto 氏が開発した Zig 製の GPU アクセラレーテッド ターミナルエミュレータです。

- **GPU レンダリングによる高速描画**: GPU アクセラレーションにより、大容量のログ出力や高速スクロールでもカクつかず低遅延で動作。
- **ネイティブ UI 統合**: macOS や Linux のネイティブ UI を採用し、タブやスプリットペインを軽快に操作可能。
- **モダンプロトコル対応**: Kitty グラフィックスプロトコルや TrueColor、アンダーライン装飾に対応し、TUI ツール（hunk, peco 等）が美しく描画されます。

---

## ghq によるリポジトリ管理の統一

`ghq` は、Git リポジトリのクローン先を決められたディレクトリ構造（デフォルトは `~/ghq/github.com/owner/repo`）に自動で整理・配置するツールです。

```bash
# リポジトリのクローン
ghq get https://github.com/fastapi/fastapi.git
ghq get owner/my-python-project

# パス一覧の確認
ghq list -p
# /home/user/ghq/github.com/fastapi/fastapi
# /home/user/ghq/github.com/owner/my-python-project
```

---

## fish ＋ peco による 1 キープロジェクト移動

`fish` のキーバインドに `ghq list -p | peco` を組み込むことで、`Ctrl + ]` を押すだけで全リポジトリを検索してジャンプする環境を構築します。

### 関数の実装 (`~/.config/fish/functions/fish_user_key_bindings.fish`)

```fish
function peco_select_ghq_repository
    set -l repo_path (ghq list -p | peco --query (commandline))
    if test -n "$repo_path"
        cd $repo_path
        commandline -f repaint
    end
end

function fish_user_key_bindings
    bind \c\] peco_select_ghq_repository
end
```

---

## tmux / herdr によるセッション永続化と AI 状態管理

### tmux：プロジェクト単位の作業部屋自動作成

ディレクトリ移動と同時に、プロジェクト専用の tmux セッションを作成またはアタッチします。

```fish
function peco_open_ghq_tmux
    set -l repo_path (ghq list -p | peco --query (commandline))
    if test -z "$repo_path"
        return
    end

    set -l session_name (basename $repo_path | tr '.' '_')

    if test -z "$TMUX"
        if tmux has-session -t $session_name 2>/dev/null
            tmux attach-session -t $session_name
        else
            tmux new-session -s $session_name -c $repo_path
        end
    else
        if not tmux has-session -t $session_name 2>/dev/null
            tmux new-session -d -s $session_name -c $repo_path
        end
        tmux switch-client -t $session_name
    end
    commandline -f repaint
end
```

### herdr：AI エージェント協働時代のマルチプレクサ

AI コーディングエージェント（Claude Code、Codex、Antigravity 等）をバックグラウンドで並行稼働させる場合、**`herdr` ([github.com/ogulcancelik/herdr](https://github.com/ogulcancelik/herdr))** が力を発揮します。

- **エージェント状態の自動認識**: 各ペインの AI が作業中（`working`）、入力待ち（`blocked`）、完了（`done`）かを自動検知。
- **tmux 互換のセッション永続化**: バックグラウンドでのプロセス維持とエージェント監視ダッシュボードを両立。

---

## Python 仮想環境（uv / venv）の自動アクティベーション

ディレクトリ移動時に、カレント配下の `.venv` を自動で有効化します。

`~/.config/fish/functions/auto_activate_venv.fish`:

```fish
function auto_activate_venv --on-variable PWD --description "ディレクトリ移動時に .venv を自動アクティベート"
    if test -n "$VIRTUAL_ENV"
        set -l venv_parent (dirname $VIRTUAL_ENV)
        if not string match -q "$venv_parent*" "$PWD"
            deactivate
        end
    end

    if test -f "$PWD/.venv/bin/activate.fish"
        if test "$VIRTUAL_ENV" != "$PWD/.venv"
            source "$PWD/.venv/bin/activate.fish"
        end
    end
end
```

Rust 製の高速パッケージマネージャー **`uv`**（`uv venv` ➔ `uv pip install ...`）と組み合わせることで、ミリ秒単位で環境構築が完了します。

---

## Jujutsu（jj）：Git 互換の次世代バージョン管理

**Jujutsu (`jj`) ([github.com/martinvonz/jj](https://github.com/martinvonz/jj))** は、Google 発の Rust 製次世代分散バージョン管理システムです。既存の Git リポジトリ（`.git`）上でそのまま透過的に動作します。

```text
+-------------------------------------------------------------+
| Jujutsu (jj) CLI                                            |
|   - 作業コピーの自動追跡（Working-copy Commit）              |
|   - 全操作の履歴管理と完全な巻き戻し（jj undo / op log）    |
|   - コンフリクトの第一級オブジェクト化（作業をブロックしない）|
+-------------------------------------------------------------+
                              │ (バックエンドとして共存)
                              ▼
+-------------------------------------------------------------+
| Standard Git Repository (.git)                              |
|   - GitHub リモートリポジトリとの通信・Push/Pull            |
+-------------------------------------------------------------+
```

### なぜ Python 開発 / AI 協働で `jj` が強力なのか？

1. **`git commit` を手動で打つ必要がない（Working-copy Commit）**:
   - ファイルを保存した瞬間、自動で背後にコミット（Change ID）が作成されます。「コミットし忘れて作業ツリーを汚す」心配がありません。
2. **どんな破壊的変更も一発で巻き戻せる (`jj undo`)**:
   - `jj` はすべての操作をオペレーションログ（`jj op log`）に記録しているため、AI がコードを壊したりリベースを誤っても、`jj undo` コマンド 1 つで完全に直前の状態へ戻せます。
3. **ブランチを切らずに複数の作業をスタックできる（Stacked Changes）**:
   - 変更（Change）を積み重ねて管理でき、作業ごとのブランチ作成・切り替えの手間を大幅に削減します。

```bash
# 既存の Git リポジトリで jj を初期化
jj git init --colocate

# 現在の状態確認（コミットツリーと変更内容が即座に表示される）
jj status
jj log

# 失敗した変更を直ちに巻き戻す
jj undo
```

---

## 差分レビューと部分コミットの高速化「hunk」

**`hunk` ([modem-dev/hunk](https://github.com/modem-dev/hunk))** は、ターミナル上でリッチなコードレビュー体験を提供する Review-First TUI ツールです。

- **ファイルツリー付きの差分レビュー**: 変更された全ファイルをツリー形式で確認し、キーボードで素早く移動。
- **インラインレビュー**: AI が生成したコードの修正理由やアノテーションを差分上で直接確認。
- **部分ステージング**: `git add -p` のように対話的に質問されず、TUI 上で必要な行を選択して直感的にコミット対象に含めることが可能。

---

## VS Code 連携：CLI からのワンショット起動

ターミナルの高速ナビゲーションと、VS Code のデバッガ・GUI 機能を繋ぎます。

```fish
function peco_open_ghq_vscode
    set -l repo_path (ghq list -p | peco --query (commandline))
    if test -n "$repo_path"
        code $repo_path
    end
    commandline -f repaint
end
```

---

## 推奨設定ファイル一覧

### `~/.config/fish/config.fish`

```fish
# PATH の設定
fish_add_path ~/.local/bin
fish_add_path /opt/homebrew/bin

# 仮想環境のプロンプト装飾を無効化
set -gx VIRTUAL_ENV_DISABLE_PROMPT 1

# コマンド履歴検索（Ctrl + R）で peco を使用
function peco_select_history
    history | peco | read -l selected
    if test -n "$selected"
        commandline $selected
    end
end

function fish_user_key_bindings
    bind \c\] peco_select_ghq_repository  # プロジェクト移動 (cd)
    bind \co  peco_open_ghq_tmux          # tmux セッション起動/アタッチ
    bind \cv  peco_open_ghq_vscode        # VS Code で開く
    bind \cr  peco_select_history         # 履歴検索
end
```

### `~/.tmux.conf`（抜粋）

```tmux
# プレフィックスキーを Ctrl + q に変更
set -g prefix C-q
unbind C-b
bind C-q send-prefix

# TrueColor の有効化
set -g default-terminal "screen-256color"
set -ga terminal-overrides ",xterm-256color:Tc"

# マウス操作の有効化
set -g mouse on

# Vim ライクなペイン移動
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# 新規ウィンドウ・ペインをカレントディレクトリで開く
bind c new-window -c "#{pane_current_path}"
bind % split-window -h -c "#{pane_current_path}"
bind '"' split-window -v -c "#{pane_current_path}"
```

---

## まとめ

- **基盤（Ghostty ＋ fish）**: GPU レンダリングの高速端末と設定不要の賢いシェルで操作の遅延を排除。
- **ナビゲーション（ghq ＋ peco ＋ uv）**: リポジトリ配置を標準化し、1 キー移動 ＋ 仮想環境の自動アクティベートを実現。
- **セッション（tmux / herdr）**: 作業状態を永続化し、AI エージェントの並行タスクをダッシュボード管理。
- **バージョン管理・レビュー（Jujutsu ＋ hunk ＋ VS Code）**: 自動コミットと完全 Undo（`jj`）で試行錯誤を安全化し、TUI（`hunk`）と GUI（`VS Code`）で差分確認とデバッグを最適化。

> ※ 本記事の構成検討・技術仕様の検証・Hugo による静的ビルド検証・推敲は、AI コーディングエージェントとの自律協働ループによって執筆・検証されています。

---

## 参考リンク・情報ソース

- [Ghostty: Fast, feature-rich, and cross-platform terminal emulator (ghostty.org)](https://ghostty.org)
- [Jujutsu (jj): A Git-compatible VCS that is both simple and powerful (GitHub)](https://github.com/martinvonz/jj)
- [herdr: Agent-aware terminal multiplexer (GitHub)](https://github.com/ogulcancelik/herdr)
- [hunk: Review-first diff viewer for terminal (GitHub)](https://github.com/modem-dev/hunk)
- [ghq: Remote repository management made easy (GitHub)](https://github.com/x-motemen/ghq)
- [peco: Simplistic interactive filtering tool (GitHub)](https://github.com/peco/peco)
- [fish shell: Friendly Interactive Shell 公式ドキュメント](https://fishshell.com)
- [tmux: Terminal Multiplexer (GitHub)](https://github.com/tmux/tmux)
- [uv: Extremely fast Python package installer and resolver (Astral)](https://github.com/astral-sh/uv)
