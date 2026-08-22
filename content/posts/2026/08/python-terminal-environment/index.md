---
date: '2026-08-22T08:50:00Z'
draft: false
title: 'Python 開発を効率化するターミナル環境設計：fish・peco・ghq・tmux によるリポジトリ・セッション管理'
description: 'fish シェル、peco（対話型フィルタ）、ghq（リポジトリ一元管理）、tmux（セッション永続化）を組み合わせた Python 開発環境の構築メモ。プロジェクト移動の 1 キー化、tmux セッションの自動アタッチ、仮想環境（uv / venv）の自動切り替え設定まで解説。'
tags: ["python", "fish", "tmux", "ghq", "peco", "cli", "dev-environment"]
categories: ["Tech", "Development Environment"]
---

## はじめに

複数の Python プロジェクト（FastAPI アプリ、CLI ツール、データ処理バッチ、ライブラリ等）を並行して開発する際、以下のような操作摩擦が積み重なり、作業の中断やコンテキストスイッチのコストを生み出します。

1. **ディレクトリ移動の手間**: 階層の深いプロジェクトパスを `cd` コマンドで手動入力する。
2. **バックグラウンドプロセスの消失**: ローカルサーバーやテスト監視、Celery ワーカーを起動したターミナルを閉じるとプロセスが終了してしまう。
3. **仮想環境（venv / uv）の切り替え忘れ**: プロジェクトを移動するたびに `source .venv/bin/activate.fish` を手動実行する必要がある。

これらの操作を自動化し、どのディレクトリからでも **ショートカット 1 つで目的の Python プロジェクトへ移動し、tmux セッションと仮想環境を即座に復元して作業を開始できる環境** を構築します。

本記事では、**`ghq` ＋ `peco` ＋ `fish` ＋ `tmux`** を組み合わせたターミナル環境の構成と設定方法を整理します。

---

## ツールスタックとそれぞれのメリット

各ツールが解決する課題と、単体で導入した場合のメリットです。

| ツール | 単体での役割 | 使わない場合（課題） | 導入後のメリット |
| :--- | :--- | :--- | :--- |
| **`ghq`** | リポジトリ配置の自動統一 | `~/work/`、`~/src/` 等に散らかり、どこにクローンしたか探す時間が発生 | `ghq get <URL>` で `~/ghq/github.com/...` に自動整理。置き場所の迷いがゼロになる |
| **`peco`** | あいまい検索・選択 | 長いパスやコマンド履歴を正確にフルタイピングする必要がある | 数文字のキーワードを入力するだけで、候補一覧からインクリメンタルに瞬時選択できる |
| **`fish`** | 設定不要で賢いシェル | 補完やシンタックスハイライト、オートサジェストに複雑な設定・プラグインが必要 | インストール直後から「過去履歴の薄い予測補完（右矢印で確定）」や構文エラー検知が動作する |
| **`tmux`** | セッション永続化・画面分割 | ウィンドウを閉じると開発サーバーやテストが終了し、タブが乱立する | ターミナルを閉じても裏でプロセスが生き続け、プロジェクト単位で作業状態を丸ごと復元できる |

---

## 4 つを組み合わせたときの開発フロー（Before / After）

これらを組み合わせることで、**「プロジェクトの切り替え摩擦」がほぼゼロ** になります。

```text
【従来のやり方（Before）】
1. 「あのプロジェクトどこだっけ…」とパスを探す
2. cd ~/projects/sub/api-server とタイピング
3. source .venv/bin/activate.fish で仮想環境を有効化
4. uvicorn main:app --reload でサーバー起動
5. 別タブを開いて pytest を起動
（別の急ぎのバグ修正が来たら、また新しいタブを開いて 1 からやり直し…）

【4つを組み合わせた場合（After）】
1. 画面のどこからでも「Ctrl + ]」を押す
2. 「api」と打って Enter
➔ これだけで、そのプロジェクト専用の tmux 部屋にジャンプし、
   仮想環境が自動で有効になり、
   裏で動いていたサーバーやテスト画面がそのまま目の前に現れる
```

```text
[ キー入力: Ctrl + ] ]
       │
       ▼
ghq list -p  ──(パス一覧を出力)──>  peco  ──(絞り込み・選択)──>  選択したプロジェクトパス
                                                                          │
                                                                          ▼
                                                              tmux セッションを自動生成/アタッチ
                                                              （.venv 自動アクティベート）
```

---

## 1. ghq によるリポジトリ管理の統一

`ghq` は、Git リポジトリのクローン先を決められたディレクトリ構造（デフォルトは `~/ghq/github.com/owner/repo`）に自動で整理・配置するツールです。

### インストールと基本操作

```bash
# macOS (Homebrew)
brew install ghq

# リポジトリのクローン
ghq get https://github.com/fastapi/fastapi.git
ghq get owner/my-python-project
```

クローンしたリポジトリはすべて一元管理され、以下のコマンドで絶対パスの一覧を出力できます。

```bash
ghq list -p
# 出力例:
# /home/user/ghq/github.com/fastapi/fastapi
# /home/user/ghq/github.com/owner/my-python-project
```

---

## 2. fish ＋ peco による 1 キープロジェクト移動

`peco` は、標準入力から受け取った文字列をインクリメンタル検索し、選択した 1 行を標準出力へ返すインタラクティブフィルターです。

`fish` のキーバインドと組み合わせることで、`Ctrl + ]`（または `Ctrl + g`）を押すだけで全リポジトリを検索してジャンプする関数を作成します。

### 関数の実装 (`~/.config/fish/functions/fish_user_key_bindings.fish`)

```fish
function peco_select_ghq_repository
    # ghq で管理されているリポジトリを peco で絞り込む
    set -l repo_path (ghq list -p | peco --query (commandline))

    if test -n "$repo_path"
        cd $repo_path
        commandline -f repaint
    end
end

function fish_user_key_bindings
    # Ctrl + ] でプロジェクト検索・移動を発動
    bind \c\] peco_select_ghq_repository
end
```

これで、カレントディレクトリがどこであっても、`Ctrl + ]` を押してリポジトリ名の一部を入力するだけで目的のディレクトリに瞬時に移動できます。

---

## 3. tmux との統合：プロジェクト単位のセッション自動生成

単に `cd` するだけでなく、**「プロジェクトごとに独立した tmux セッションを自動作成またはアタッチする」** 仕組みを組み込みます。

これにより、プロジェクトごとにエディタ、開発サーバー（`uvicorn` 等）、テスト監視（`pytest -f`）のペイン状態が保持され、プロジェクトを切り替えても作業コンテキストが失われません。

### tmux 連携関数の実装 (`peco_open_ghq_tmux`)

```fish
function peco_open_ghq_tmux
    set -l repo_path (ghq list -p | peco --query (commandline))
    if test -z "$repo_path"
        return
    end

    # ディレクトリ名からセッション名を生成（ドット等の記号をアンダースコアに置換）
    set -l session_name (basename $repo_path | tr '.' '_')

    # tmux セッション外にいる場合
    if test -z "$TMUX"
        # セッションが既に存在するか確認
        if tmux has-session -t $session_name 2>/dev/null
            tmux attach-session -t $session_name
        else
            # 新規セッションを作成して対象ディレクトリで起動
            tmux new-session -s $session_name -c $repo_path
        end
    else
        # 既に tmux 内にいる場合は switch-client でセッションを切り替える
        if not tmux has-session -t $session_name 2>/dev/null
            tmux new-session -d -s $session_name -c $repo_path
        end
        tmux switch-client -t $session_name
    end

    commandline -f repaint
end
```

この関数をキーバインド（例: `Ctrl + o`）に割り当てることで、tmux 内外を問わずワンタッチでプロジェクトごとの作業空間を行き来できるようになります。

---

## 4. Python 仮想環境（uv / venv）の自動アクティベーション

Python 開発ではプロジェクトごとの仮想環境分離が必須です。ディレクトリ移動時、カレント配下に `.venv` が存在すれば自動でアクティベートする設定を `fish` に組み込みます。

### `fish` のイベントフック（`on_variable PWD`）による自動切り替え

`~/.config/fish/functions/auto_activate_venv.fish`:

```fish
function auto_activate_venv --on-variable PWD --description "ディレクトリ移動時に .venv を自動アクティベート"
    # すでに同じ venv がアクティブな場合は何もしない
    if test -n "$VIRTUAL_ENV"
        # カレントディレクトリが VIRTUAL_ENV の親ディレクトリ外に出た場合は deactivate
        set -l venv_parent (dirname $VIRTUAL_ENV)
        if not string match -q "$venv_parent*" "$PWD"
            deactivate
        end
    end

    # カレントディレクトリまたは上位ディレクトリに .venv が存在すれば activate
    if test -f "$PWD/.venv/bin/activate.fish"
        if test "$VIRTUAL_ENV" != "$PWD/.venv"
            source "$PWD/.venv/bin/activate.fish"
        end
    end
end
```

### 高速なパッケージマネージャー `uv` との組み合わせ

モダンな Python プロジェクトでは、Rust 製の高速パッケージマネージャー **`uv`** を併用することで、環境構築と依存関係の解決が数秒で完了します。

```bash
# プロジェクト作成と仮想環境初期化
cd (ghq root)/github.com/owner/my-app
uv venv
# ↑ 作成された時点で fish のフックにより即座に .venv がアクティベートされる

# 依存パッケージの追加
uv pip install fastapi uvicorn
```

---

## 5. 推奨設定ファイル一覧

本環境を構成する設定ファイルの全体像です。

### `~/.config/fish/config.fish`

```fish
# PATH の設定
fish_add_path ~/.local/bin
fish_add_path /opt/homebrew/bin

# 仮想環境のプロンプト装飾を無効化（starship や tide 等のプロンプトツールを使う場合）
set -gx VIRTUAL_ENV_DISABLE_PROMPT 1

# コマンド履歴検索（Ctrl + R）で peco を使用
function peco_select_history
    history | peco | read -l selected
    if test -n "$selected"
        commandline $selected
    end
end

function fish_user_key_bindings
    bind \c\] peco_select_ghq_repository
    bind \co  peco_open_ghq_tmux
    bind \cr  peco_select_history
end
```

### `~/.tmux.conf`（抜粋）

```tmux
# プレフィックスキーを Ctrl + b から Ctrl + q（または Ctrl + a）に変更
set -g prefix C-q
unbind C-b
bind C-q send-prefix

# 256色 / TrueColor の有効化
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

## 運用のメリットと効果

1. **ディレクトリ階層の迷子を排除**:
   - リポジトリの配置ルールが `ghq` で固定されるため、「どこにクローンしたか」を探す時間がゼロになります。
2. **作業セッションの即時復元**:
   - サーバープロセスや REPL（IPython）、テスト監視を動かしたまま別のバグ修正セッションへ移動し、後から全く同じ画面状態へ復帰できます。
3. **Python バージョン・依存関係の衝突防止**:
   - プロジェクトに入った瞬間に `.venv` が適用されるため、グローバル環境の汚染やパッケージバージョンの不整合が起きません。

---

## まとめ

- **`ghq`**: リポジトリの配置場所を `~/ghq/` 配下に完全標準化する。
- **`peco` ＋ `fish`**: `ghq list -p` をパイプで繋ぎ、キー 1 つで任意のプロジェクトへ移動する。
- **`tmux`**: プロジェクトごとにセッションを永続化し、コンテキストスイッチの摩擦をなくす。
- **`uv` ＋ 自動 activate**: ディレクトリ移動に連動して仮想環境を切り替え、安全・高速な Python 開発を実現する。

> ※ 本記事の構成検討・技術仕様の検証・Hugo による静的ビルド検証・推敲は、AI コーディングエージェントとの自律協働ループによって執筆・検証されています。

---

## 参考リンク・情報ソース

- [ghq: Remote repository management made easy (GitHub)](https://github.com/x-motemen/ghq)
- [peco: Simplistic interactive filtering tool (GitHub)](https://github.com/peco/peco)
- [fish shell: Friendly Interactive Shell 公式ドキュメント](https://fishshell.com)
- [tmux: Terminal Multiplexer (GitHub)](https://github.com/tmux/tmux)
- [uv: Extremely fast Python package installer and resolver (Astral)](https://github.com/astral-sh/uv)
