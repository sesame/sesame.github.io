---
title: TypeScriptメモ
subtitle:
date: 2026-08-23T07:44:42Z
slug: 633de3d
draft: true
description:
keywords:
weight: 0
categories:
  - draft
collections:
  - draft
tags:
  - draft
summary:
featured_image:
featured_image_preview:
password:
message:
repost:
  enable: false
  url:

# See: https://fixit.lruihao.cn/docs/content-management/front-matter/
---

> [!NOTE] 個人用メモ・備忘録
> 日々の開発・インフラ検証の備忘録として残している個人ノートです。手元環境での動作ログをもとにまとめています。環境差異等もあるため、参考にされる場合はご自身の環境で検証の上ご活用ください。

## TypeScript コンパイラによるトランスパイル

TypeScript ソースコードを JavaScript ソースコードに変換することです。

## Node.js

TypeScript で書いたプログラムは、ブラウザ上で動くもの、Node.js で動くもの、Deno で動くものなどの種類があります。

Node.js は、Google Chrome で使われている JavaScript エンジン「V8」をベースに作られた、サーバーサイドやローカル環境で JavaScript を動かすための実行環境(ランタイム)です。

元々 Web ブラウザの中だけで動いていた JavaScript を、ブラウザの外である OS 上でも直接実行できるようにしたことで、Web 開発のあり方を大きく変えました。

Node.js は JavaScript を実行するためのランタイムであるため、TypeScript で書かれたプログラムは事前に JavaScript へトランスパイル(型情報の除去・構文変換)してから実行します。

### package.json

Node.js のプロジェクトに用意するファイルであり、プロジェクトの依存関係、プロジェクトの設定、プロジェクトのバージョン番号などを記載します。

`package.json` は次のコマンドで用意します。

```console
$ npm init --yes
```

作成された `package.json` は次のようになっています。

```json {title="package.json"}
{
  "name": "typescript",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs"
}
```

TypeScript の場合は、プロジェクト全体を公式標準規格である ES Modules(ESM) として Node.js に認識・実行させるために、`type` に `module` を指定します。

```json {title="package.json"}
{
  "name": "typescript",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "module"
}
```

> [!TIP] なぜ `type: "module"` を指定するのか？
> デフォルトの Node.js はモジュールを CommonJS(`require`) として扱いますが、`"type": "module"` を指定することで、標準仕様である **ES Modules(`import` / `export`)** として認識・実行させるためです。これにより、トランスパイル後の JavaScript で `import` 構文がそのまま正しく動作するようになります。

### TypeScript のインストール

Node.js 単体には TypeScript を解釈・変換するコンパイラ(`tsc`) が含まれていません。

そのため、Node.js 上で動作する、JavaScript で作られた TypeScript 公式のコンパイラ＆開発ツール一式である `typescript` という npm パッケージをプロジェクトに導入する必要があります。

> [!TIP] Python の世界に例えると？
> 「Python 本体には型チェック機能がないので、`pip` で `mypy`(型チェッカー) をインストールして使う」のと全く同じ感覚です。

```console
$ npm install --save-dev typescript @types/node
```

`npm`(Node Package Manager) は、Node.js に標準で付属している公式のパッケージマネージャー(パッケージ管理ツール)です。Python の `pip` や Ruby の `gem` に相当します。

世界中の開発者が作成・公開したライブラリをコマンド 1 つ(`npm install`) で導入したり、プロジェクトで使うツールのバージョン管理を行ったりする役割を持っています。

> [!TIP] `--save-dev` (`-D`) と `@types/node`
> - **`--save-dev` (`-D`)**: 「開発時・ビルド時だけのツール」として `package.json` に記録する指定。
> - **`@types/node`**: Node.js の標準機能(`fs`, `path`, `process` 等)を TypeScript でエラーなく安全に使うための型説明書。
> - **`@types/...` (DefinitelyTyped)**: `@types/パッケージ名` という名前で npm に公開されている、既存の JavaScript ライブラリ向けの型定義ファイルを導入する仕組み。

`npm install` を行うと、`package.json` と同じ場所に `node_modules/` というディレクトリと、`package-lock.json` というファイルが生成されます。

`package-lock.json` は現在インストールされているパッケージの厳密なバージョン情報を記録したファイルであり、人間が直接操作するのではなく、`npm` により自動的に管理・更新されます。

`node_modules/` ディレクトリには、インストールされたパッケージの実体(コードファイル群)が配置されます。

`npm` コマンドによってパッケージを導入すると、 `package.json` には
依存関係情報が入ります。

```json
  "devDependencies": {
    "@types/node": "^26.2.0",
    "typescript": "^7.0.2"
  }
```

`git clone` でリポジトリをクローンした状態では、`package.json` や `package-lock.json` はすでに存在するが、`node_modules/` がまだないという状態になります。その場合は引数なしの `npm install` コマンドを実行することで、`node_modules/` ディレクトリに必要なパッケージが導入されます。

### コンパイラ設定ファイル

コンパイラの設定を行う `tsconfig.json` を用意します。

```console
$ npx tsc --init
```

`npx`(Node Package eXecute) は、プロジェクト内にインストールされたパッケージのコマンドを実行するためのツールです。Node.js に標準で同梱されています。

`npm install --save-dev typescript` で導入した `tsc` コマンドは、プロジェクト内の `node_modules/.bin/` 配下に配置されているため、ターミナルで単に `$ tsc` と打っても直接実行できません。

`$ npx tsc --init` のように `npx` を経由することで、`npx` が自動的に `node_modules/` 内の `tsc` を見つけて実行してくれます。

> [!NOTE] なぜ `npx` を使うのか？
> プロジェクトごとに異なるバージョンのツールを安全に使い分けるため、現代の開発ではツールをグローバル(`-g`) ではなくローカル(`-D`) に導入し、`npx` 経由で実行するのがデファクト標準となっています。

初期状態の `tsconfig.json` は次の状態です。

```json {title="tsconfig.json"}
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "esnext",
    "types": [],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
  }
}
```

主な設定項目の説明は以下の通りです。

- **`target`**:
  - トランスパイル後に出力する JavaScript のバージョン(ECMAScript の世代) を指定します。
  - 例: `"ES2022"`, `"ES2020"`, `"ESNext"`(最新仕様)。
  - 実行環境(動かしたい Node.js のバージョンや対応ブラウザ) に合わせて指定します。モダンな環境では `"ES2022"` や `"ESNext"` が一般的です。
- **`module`**:
  - 出力される JavaScript が使用するモジュールシステムの種類(`import`/`export` の形式) を指定します。
  - 例: `"NodeNext"`, `"ESNext"`, `"CommonJS"`。
  - Node.js で ES Modules を扱う場合は、`package.json` の `"type": "module"` と合わせて `"NodeNext"` を指定します。
- **`moduleResolution`**:
  - TypeScript が `import` 文から対象のモジュール(ファイルや npm パッケージ) をどのように探索・解決するか(探索アルゴリズム) を指定します。
  - 例: `"NodeNext"`, `"Bundler"`(Vite や Webpack 等を使用する場合)。
  - `"module": "NodeNext"` を指定した場合は、自動的に `moduleResolution` も `NodeNext` に設定されます。
- **`types`**:
  - グローバルに読み込む型定義パッケージ(`@types/...`) を明示的に指定します。
  - 例: `["node"]`。
  - 初期状態の空配列(`"types": []`) のままだと `@types/node` が無視されてしまうため、Node.js 固有の型を認識させるには `["node"]` を指定します(省略した場合はインストールされた型定義が自動で読み込まれます)。
- **`rootDir`**:
  - ソースコードのルートディレクトリ(起点) を明示的に指定します。
  - 例: `"./src"`。
  - `outDir` を指定した際に、出力先ディレクトリの階層構造を正確に保つために指定します。
- **`outDir`**:
  - トランスパイルされた JavaScript ファイル(`.js`) や型定義ファイル(`.d.ts`) の保存先ディレクトリ(出力先) を指定します。
  - 例: `"./dist"`, `"./build"`。
  - 指定しないと `.ts` と同じ場所に `.js` が生成されてファイルが混ざってしまうため、通常は `"./dist"` などを指定して成果物を分離します。
- **`include`**:
  - コンパイル・型チェックの対象とするファイルやディレクトリの範囲を指定します。
  - 例: `["src/**/*"]`。
  - ソースコードを置くディレクトリ(`src/` など) のみを対象として指定することで、不要なファイルがコンパイルされるのを防ぎます。

> [!TIP] `**/*` (ワイルドカード記法) の意味
> - **`**` (ディレクトリの再帰検索)**: 何階層深くなってもすべてのサブディレクトリを含める指定です(`src/` 直下だけでなく `src/components/`, `src/utils/helpers/` なども対象)。
> - **`*` (ファイル名の全指定)**: 任意のファイル名を表します。
>
> これらを組み合わせた `src/**/*` は、**「`src/` ディレクトリ配下にある、すべてのサブフォルダ内の全ファイル」** をまとめて指定する定番の書き方です。

今回は、参考にしている書籍の内容をベースにしつつ、最新の TypeScript 仕様に合わせて次のように設定します。

> [!WARNING] 最新の TypeScript でのエラーと対策
> 書籍の古い指定(`"moduleResolution": "node"`) のまま最新の TypeScript でコンパイルを実行すると、以下のエラーが発生する場合があります。
>
> 1. **`error TS5108: Option 'moduleResolution=node10' has been removed.`**
>    - **原因**: 古い Node10 方式のモジュール解決が廃止されたため。
>    - **対策**: `"module": "nodenext"` および `"moduleResolution": "nodenext"` を指定します。
> 2. **`error TS5011: ... The 'rootDir' setting must be explicitly set`**
>    - **原因**: 出力先(`outDir`) 指定時にソース起点ディレクトリの明示が必要になったため。
>    - **対策**: `"rootDir": "./src"` を明示します。

これらを反映した最終的な `tsconfig.json` は以下の通りです。

```json {title="tsconfig.json"}
{
  "compilerOptions": {
    "target": "es2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "rootDir": "./src",
    "outDir": "./dist",
    "types": ["node"],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  },
  "include": ["./src/**/*.ts"]
}
```


### 参考

プロを目指すためのTYPESCRIPT入門 安全なコードの書き方から高度な型の使い方