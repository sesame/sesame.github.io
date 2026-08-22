---
date: '2026-08-22T08:50:00Z'
draft: false
title: 'Python 開発を効率化するターミナル環境設計：fish・peco・ghq・tmux から VS Code・Herdr・Hunk 連携まで'
description: 'fish、peco、ghq、tmux を中核としたリポジトリ・セッション管理から、VS Code との GUI 連携、AI エージェント対応マルチプレクサ herdr、TUI 差分レビューツール hunk を取り入れたモダンな Python 開発環境の構築メモ。'
tags: ["python", "fish", "tmux", "ghq", "peco", "vscode", "herdr", "hunk", "cli", "dev-environment"]
categories: ["Tech", "Development Environment"]
---

## はじめに

複数の Python プロジェクト（FastAPI アプリ、CLI ツール、データ処理バッチ、ライブラリ等）を並行して開発する際、以下のような操作摩擦が積み重なり、作業の中断やコンテキストスイッチのコストを生み出します。

1. **ディレクトリ移動の手間**: 階層の深いプロジェクトパスを `cd` コマンドで手動入力する。
2. **バックグラウンドプロセスの消失**: ローカルサーバーやテスト監視、ワーカープロセスを起動したターミナルを閉じるとプロセスが終了してしまう。
3. **仮想環境（venv / uv）の切り替え忘れ**: プロジェクトを移動するたびに手動で activate する必要がある。
4. **GUI エディタや差分レビューの起動コスト**: ターミナルからエディタ（VS Code）や Git 差分確認画面への行き来に手間がかかる。

これらの操作を自動化し、どのディレクトリからでも **ショートカット 1 つで目的の Python プロジェクトへ移動し、セッションと仮想環境を即座に復元して作業を開始できる環境** を構築します。

本記事では、**`ghq` ＋ `peco` ＋ `fish` ＋ `tmux`** によるクラシックな高速基盤に加え、**`VS Code`（GUI 連携）**、AI エージェント対応マルチプレクサ **`herdr`**、および TUI 差分レビューツール **`hunk`** を組み合わせたモダンな開発環境設計を整理します。

---

## ツールスタックとそれぞれのメリット

各ツールが解決する課題と、導入後の具体的なメリットです。

| ツール | 単体での役割 | 使わない場合（課題） | 導入後のメリット |
| :--- | :--- | :--- | :--- |
| **`ghq`** | リポジトリ配置の自動統一 | `~/work/`、`~/src/` 等に散らかり、どこにクローンしたか探す時間が発生 | `ghq get <URL>` で `~/ghq/github.com/...` に自動整理。置き場所の迷いがゼロになる |
| **`peco`** | あいまい検索・選択 | 長いパスやコマンド履歴を正確にフルタイピングする必要がある | 数文字のキーワードを入力するだけで、候補一覧からインクリメンタルに瞬時選択できる |
| **`fish`** | 設定不要で賢いシェル | 補完やシンタックスハイライト、オートサジェストに複雑な設定・プラグインが必要 | インストール直後から「過去履歴の薄い予測補完（右矢印で確定）」や構文エラー検知が動作する |
| **`tmux`** | セッション永続化・画面分割 | ウィンドウを閉じると開発サーバーやテストが終了し、タブが乱立する | ターミナルを閉じても裏でプロセスが生き続け、プロジェクト単位で作業状態を丸ごと復元できる |
| **`VS Code`** | GUI エディタ / デバッグ | CLI だけでは複雑なマルチファイル編集や視覚的デバッグが煩雑 | `code <path>` で CLI から瞬時に開き、Dev Containers で完全分離環境と連携 |
| **`herdr`** | Agent-Aware マルチプレクサ | 複数の AI エージェント（Claude Code 等）を動かすと誰が作業中か把握困難 | 各ペインで稼働する AI の状態（working / blocked / done）を自動検知してダッシュボード管理 |
| **`hunk`** | Review-First TUI 差分ビューア | `git diff` のスクロールや対話的 `git add -p` での確認に時間がかかる | AI が生成した変更差分をインラインで高速レビューし、行単位で決定論的にステージング |

---

## 組み合わせたときの開発フロー（Before / After）

これらを組み合わせることで、**「プロジェクトの切り替え摩擦」がほぼゼロ** になります。

```text
【従来のやり方（Before）】
1. 「あのプロジェクトどこだっけ…」とパスを探す
2. cd ~/projects/sub/api-server とタイピング
3. source .venv/bin/activate.fish で仮想環境を有効化
4. uvicorn main:app --reload でサーバー起動
5. 別タブを開いて pytest を起動
6. VS Code を立ち上げてフォルダを開き直す
（別の急ぎのバグ修正が来たら、また新しいタブを開いて 1 からやり直し…）

【モダン環境（After）】
1. 画面のどこからでも「Ctrl + ]」を押す
2. 「api」と打って Enter
➔ これだけで、そのプロジェクト専用の tmux（または herdr）部屋にジャンプし、
   仮想環境（uv/venv）が自動で有効になり、
   裏で動いていたサーバーやテスト画面がそのまま目の前に復帰する
3. 必要に応じて「Ctrl + v」で VS Code をワンショット起動
4. AI が書いた差分は「hunk」で瞬時に視覚的レビュー
```

```text
[ キー入力: Ctrl + ] ]
       │
       ▼
ghq list -p  ──(パス一覧を出力)──>  peco  ──(絞り込み・選択)──>  選択したプロジェクトパス
                                                                          │
                                                                          ├──> tmux / herdr セッション自動アタッチ（.venv 自動有効化）
                                                                          └──> VS Code 起動（code <path>）
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

---

## 3. tmux による「プロジェクト = セッション」の自動生成

単に `cd` するだけでなく、**「プロジェクトごとに独立した tmux セッションを自動作成またはアタッチする」** 仕組みを組み込みます。

これにより、プロジェクトごとにエディタ、開発サーバー（`uvicorn` 等）、テスト監視（`pytest -f`）のペイン状態が保持され、プロジェクトを切り替えても作業コンテキストが失われません。

### tmux 連携関数の実装 (`peco_open_ghq_tmux`)

```fish
function peco_open_ghq_tmux
    set -l repo_path (ghq list -p | peco --query (commandline))
    if test -z "$repo_path"
        return
    end

    # ディレクトリ名からセッション名を生成（記号を置換）
    set -l session_name (basename $repo_path | tr '.' '_')

    # tmux セッション外にいる場合
    if test -z "$TMUX"
        if tmux has-session -t $session_name 2>/dev/null
            tmux attach-session -t $session_name
        else
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

---

## 4. Python 仮想環境（uv / venv）の自動アクティベーション

ディレクトリ移動時、カレント配下に `.venv` が存在すれば自動でアクティベートする設定を `fish` に組み込みます。

### `fish` のイベントフック（`on_variable PWD`）

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

### 高速パッケージマネージャー `uv` との組み合わせ

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

## 5. VS Code 連携：CLI からのワンショット起動

ターミナルの高速な移動性と、VS Code の高機能なデバッガ・GUI 編集機能をシームレスに繋ぎます。

### `peco` から直接 VS Code を開く関数 (`peco_open_ghq_vscode`)

```fish
function peco_open_ghq_vscode
    set -l repo_path (ghq list -p | peco --query (commandline))
    if test -n "$repo_path"
        code $repo_path
    end
    commandline -f repaint
end
```

`Ctrl + v` にこの関数をバインドしておけば、ターミナル上でプロジェクトを絞り込んで即座に VS Code の新しいウィンドウで開くことができます。

---

## 6. 次世代の選択肢：AI エージェント対応マルチプレクサ「herdr」

AI コーディングエージェント（Claude Code、Codex、GitHub Copilot CLI、Antigravity 等）をバックグラウンドで並行稼働させるケースが増えています。

従来の `tmux` は人間が操作することを前提としていますが、Rust 製のターミナルマルチプレクサ **`herdr` ([github.com/ogulcancelik/herdr](https://github.com/ogulcancelik/herdr))** は **「Agent-Aware（エージェント対応）」** な設計が特徴です。

- **エージェント状態の自動検知**: 各ペインで動作する AI エージェントのステータス（`working`, `blocked`, `done`, `idle`）を自動認識。
- **ダッシュボード管理**: どのエージェントが入力を待っているか（blocked）、作業が完了したか（done）を一覧で把握可能。
- **tmux 互換の永続性**: バックグラウンドサーバーによるセッション永続化を維持しながら、エージェント協働に特化した UI を提供。

---

## 7. 差分レビューと部分コミットの高速化「hunk」

AI コーディングエージェントが生成した大量のコード変更をレビューする際、標準の `git diff` や対話型の `git add -p` では確認速度が追いつかない課題があります。

ここで役立つのが **`hunk` ([modem-dev/hunk](https://github.com/modem-dev/hunk))** などの Review-First TUI ツールです。

- **マルチファイル差分の TUI レビュー**: ファイルツリー付きの分割画面で、AI が変更した全ファイルの差分をキーボード操作で高速レビュー。
- **インラインアノテーション**: 変更理由やエージェントのコメントを差分上で直接確認。
- **行単位の決定論的ステージング**: 必要な変更行だけを正確に選択してコミット対象に含めることが可能。

---

## 8. 推奨設定ファイル一覧

本環境を構成する設定ファイルの全体像です。

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
    bind \c\] peco_select_ghq_repository  # プロジェクト移動
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

## まとめ

- **`ghq` ＋ `peco`**: リポジトリの配置場所を標準化し、1 キーで目的のプロジェクトへ移動。
- **`fish` ＋ `uv`**: 設定不要の高速シェルと自動アクティベートで Python 仮想環境の管理摩擦を排除。
- **`tmux` / `herdr`**: セッションを永続化し、複数プロジェクトや AI エージェントの並行作業を整理。
- **`VS Code` ＋ `hunk`**: CLI の機動力と GUI/TUI の視覚的レビュー・デバッグを最適に組み合わせる。

> ※ 本記事の構成検討・技術仕様の検証・Hugo による静的ビルド検証・推敲は、AI コーディングエージェントとの自律協働ループによって執筆・検証されています。

---

## 参考リンク・情報ソース

- [ghq: Remote repository management made easy (GitHub)](https://github.com/x-motemen/ghq)
- [peco: Simplistic interactive filtering tool (GitHub)](https://github.com/peco/peco)
- [fish shell: Friendly Interactive Shell 公式ドキュメント](https://fishshell.com)
- [tmux: Terminal Multiplexer (GitHub)](https://github.com/tmux/tmux)
- [herdr: Agent-aware terminal multiplexer (GitHub)](https://github.com/ogulcancelik/herdr)
- [hunk: Review-first diff viewer for terminal (GitHub)](https://github.com/modem-dev/hunk)
- [uv: Extremely fast Python package installer and resolver (Astral)](https://github.com/astral-sh/uv)
