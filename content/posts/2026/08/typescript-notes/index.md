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

## `TypeScript` とは

### `Node.js`

`Node.js` は、 `Google Chrome` で使われている `JavaScript` エンジン「V8」をベースに作られた、ブラウザの外、パソコンやサーバー上で `JavaScript` を動かすための実行環境(ランタイム)です。

`JavaScript` はもともと「ブラウザの中で `Web` ページを動かすための言語でした。しかし、
`Node.js` の登場によって役割が大きく広がっています。

ブラウザの中の `JavaScript` はセキュリティ上「PC のファイルを直接読み書きする」「自由に OS のコマンドを実行する」といった
操作が制限されています。

`Node.js` はそれらの制限がなく、 `Python` や `Ruby` 、 `Go` などのように普通の
汎用プログラミング環境として動作します。

### `npm`

`npm` (Node Package Manager)は、`Node.js` に標準で付属している公式のパッケージマネージャー(パッケージ管理ツール)です。`Python` の `pip` や `Ruby` の `gem` に相当します。

世界中の開発者が作成・公開したライブラリをコマンド 1 つ(`npm install`)で導入したり、プロジェクトで使うツールのバージョン管理を行ったりする役割を持っています。

具体的には、主に以下の 2 つの側面を持っています。

- **オンラインレジストリ** (`npmjs.com`):
  世界中の開発者が作成したオープンソースの `JavaScript` / `TypeScript` ライブラリが登録・公開されている巨大な公開データベースです。
- **CLI ツール** (`npm` コマンド):
  `Node.js` に同梱されているコマンドラインツールです。レジストリからのパッケージ取得、プロジェクトごとの依存関係の管理(`package.json`)、ビルドやテスト等のタスク実行(`npm run <script>`)を行います。

#### `npm` の主な役割

1. **パッケージのインストールと依存関係の解決**:
   `npm install <パッケージ名>` を実行することで、指定したライブラリとそれが依存している他の関連ライブラリを自動的に解析し、一括でダウンロードします。
2. **プロジェクトの依存関係の記録**:
   プロジェクトでどのライブラリのどのバージョンを使用しているかを `package.json` や `package-lock.json` に記録し、チーム開発やデプロイ先で全く同じ環境を再現できるようにします。
3. **プロジェクトスクリプトの実行**:
   `package.json` の `scripts` フィールドに定義したカスタムコマンド(ビルド、テスト、ローカルサーバー起動など)を `npm run build` や `npm start` などの形式で統一的に実行できます。

#### 主なインストールオプション(`-g` と `-D`)

`npm install` では、パッケージを導入する場所(スコープ)や用途に応じて以下のオプションを使い分けます。

| オプション | 記録先 | 用途・特徴 |
| :--- | :--- | :--- |
| **開発用ローカル**<br>(`-D` / `--save-dev`) | `package.json`<br>(`devDependencies`) | **開発時・ビルド時のみ使うツール** (`typescript`, `eslint`, テストツール等)。プロジェクト内の `node_modules/` に導入されます。 |
| **本番用ローカル**<br>(指定なし / `-S`) | `package.json`<br>(`dependencies`) | **本番環境の動作に必要なライブラリ** (`express`, `react` 等)。製品コードの一部として実行時に直接使われます。 |
| **グローバル**<br>(`-g` / `--global`) | PC 全体<br>(システム共通領域) | **OS 全体で共通して使う CLI ツール**。どのディレクトリからでも直接コマンドを実行できますが、プロジェクトごとのバージョン固定が難しくなるため、現代ではローカル導入＋`npx` の利用が推奨されます。 |

#### `npx` (パッケージ実行ツール)

`npx` (Node Package eXecute)は、`npm` に標準で同梱されている、パッケージのコマンド(CLI ツール)を直接実行するための付属ツールです。

- **役割の違い**:
  - **`npm`**: パッケージの **管理** (インストール・更新・削除・依存関係の記録)を行う
  - **`npx`**: パッケージが提供する **コマンドの実行** (ローカルツールの直接起動や一時実行)を行う
- **主な活用パターン**:
  1. **プロジェクト内のローカルツールを実行する**:
     例えば `npm install --save-dev typescript` で導入した `tsc` コマンドはプロジェクト内の `node_modules/.bin/` 配下に配置されるため、ターミナルで直接 `$ tsc` と打っても実行できません。`$ npx tsc` と実行することで、`npx` が自動的に `node_modules/` 内の `tsc` を探し出して実行します。
  2. **インストールせずに「1 回だけ使い捨て実行」する**:
     プロジェクトの初期化ツールなどを PC 全体(グローバル)に恒久インストールすることなく、最新版を一時的にダウンロードして即座に実行できます。

### TypeScript コンパイラによるトランスパイル

`TypeScript` ソースコードを `JavaScript` ソースコードに変換することです。
`Node.js` は `JavaScript` を実行するためのランタイムであるため、`TypeScript` で書かれたプログラムは事前に `JavaScript` へトランスパイル(型情報の除去・構文変換)してから実行します。

### `TypeScript` のインストール

Node.js 単体には TypeScript を解釈・変換するコンパイラ(`tsc`)が含まれていません。

そのため、Node.js 上で動作する、JavaScript で作られた TypeScript 公式のコンパイラ＆開発ツール一式である `typescript` という npm パッケージをプロジェクトに導入する必要があります。

> [!TIP] Python の世界に例えると?
> 「Python 本体には型チェック機能がないので、`pip` で `mypy`(型チェッカー)をインストールして使う」のと全く同じ感覚です。

```console
$ npm install --save-dev typescript @types/node
```

> [!TIP] `--save-dev`(`-D`)と `@types/node`
> - **`--save-dev`** (`-D`): 「開発時・ビルド時だけのツール」として `package.json` に記録する指定。
> - **`@types/node`**: Node.js の標準機能(`fs`, `path`, `process` 等)を TypeScript でエラーなく安全に使うための型説明書。
> - **`@types/...`** (DefinitelyTyped): `@types/パッケージ名` という名前で npm に公開されている、既存の JavaScript ライブラリ向けの型定義ファイルを導入する仕組み。

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

### `package.json`

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

TypeScript の場合は、プロジェクト全体を公式標準規格である ES Modules(ESM)として Node.js に認識・実行させるために、`type` に `module` を指定します。

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

> [!TIP] なぜ `type: "module"` を指定するのか?
> デフォルトの Node.js はモジュールを CommonJS(`require`)として扱いますが、`"type": "module"` を指定することで、標準仕様である **ES Modules** (`import` / `export`)として認識・実行させるためです。これにより、トランスパイル後の JavaScript で `import` 構文がそのまま正しく動作するようになります。


### コンパイラ設定ファイル

コンパイラの設定を行う `tsconfig.json` を用意します。

```console
$ npx tsc --init
```

`npx`(Node Package eXecute)は、プロジェクト内にインストールされたパッケージのコマンドを実行するためのツールです。Node.js に標準で同梱されています。

`npm install --save-dev typescript` で導入した `tsc` コマンドは、プロジェクト内の `node_modules/.bin/` 配下に配置されているため、ターミナルで単に `$ tsc` と打っても直接実行できません。

`$ npx tsc --init` のように `npx` を経由することで、`npx` が自動的に `node_modules/` 内の `tsc` を見つけて実行してくれます。

> [!NOTE] なぜ `npx` を使うのか?
> プロジェクトごとに異なるバージョンのツールを安全に使い分けるため、現代の開発ではツールをグローバル(`-g`)ではなくローカル(`-D`)に導入し、`npx` 経由で実行するのがデファクトスタンダードとなっています。

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
  - トランスパイル後に出力する JavaScript のバージョン(ECMAScript の世代)を指定します。
  - 例: `"ES2022"`, `"ES2020"`, `"ESNext"`(最新仕様)。
  - 実行環境(動かしたい Node.js のバージョンや対応ブラウザ)に合わせて指定します。モダンな環境では `"ES2022"` や `"ESNext"` が一般的です。
- **`module`**:
  - 出力される JavaScript が使用するモジュールシステムの種類(`import`/`export` の形式)を指定します。
  - 例: `"NodeNext"`, `"ESNext"`, `"CommonJS"`。
  - Node.js で ES Modules を扱う場合は、`package.json` の `"type": "module"` と合わせて `"NodeNext"` を指定します。
- **`moduleResolution`**:
  - TypeScript が `import` 文から対象のモジュール(ファイルや npm パッケージ)をどのように探索・解決するか(探索アルゴリズム)を指定します。
  - 例: `"NodeNext"`, `"Bundler"`(Vite や Webpack 等を使用する場合)。
  - `"module": "NodeNext"` を指定した場合は、自動的に `moduleResolution` も `NodeNext` に設定されます。
- **`types`**:
  - グローバルに読み込む型定義パッケージ(`@types/...`)を明示的に指定します。
  - 例: `["node"]`。
  - 初期状態の空配列(`"types": []`)のままだと `@types/node` が無視されてしまうため、Node.js 固有の型を認識させるには `["node"]` を指定します(省略した場合はインストールされた型定義が自動で読み込まれます)。
- **`rootDir`**:
  - ソースコードのルートディレクトリ(起点)を明示的に指定します。
  - 例: `"./src"`。
  - `outDir` を指定した際に、出力先ディレクトリの階層構造を正確に保つために指定します。
- **`outDir`**:
  - トランスパイルされた JavaScript ファイル(`.js`)や型定義ファイル(`.d.ts`)の保存先ディレクトリ(出力先)を指定します。
  - 例: `"./dist"`, `"./build"`。
  - 指定しないと `.ts` と同じ場所に `.js` が生成されてファイルが混ざってしまうため、通常は `"./dist"` などを指定して成果物を分離します。
- **`include`**:
  - コンパイル・型チェックの対象とするファイルやディレクトリの範囲を指定します。
  - 例: `["src/**/*"]`。
  - ソースコードを置くディレクトリ(`src/` など)のみを対象として指定することで、不要なファイルがコンパイルされるのを防ぎます。

> [!TIP] `**/*`(ワイルドカード記法)の意味
> - `**` (ディレクトリの再帰検索): 何階層深くなってもすべてのサブディレクトリを含める指定です(`src/` 直下だけでなく `src/components/`, `src/utils/helpers/` なども対象)。
> - `*` (ファイル名の全指定): 任意のファイル名を表します。
>
> これらを組み合わせた `src/**/*` は、「`src/` ディレクトリ配下にある、すべてのサブフォルダ内の全ファイル」をまとめて指定する定番の書き方です。

今回は、参考にしている書籍の内容をベースにしつつ、最新の TypeScript 仕様に合わせて次のように設定します。

> [!WARNING] 最新の TypeScript でのエラーと対策
> 書籍の古い指定(`"moduleResolution": "node"`)のまま最新の TypeScript でコンパイルを実行すると、以下のエラーが発生する場合があります。
>
> 1. **`error TS5108: Option 'moduleResolution=node10' has been removed.`**
>    - **原因**: 古い Node10 方式のモジュール解決が廃止されたため。
>    - **対策**: `"module": "nodenext"` および `"moduleResolution": "nodenext"` を指定します。
> 2. **`error TS5011: ... The 'rootDir' setting must be explicitly set`**
>    - **原因**: 出力先(`outDir`)指定時にソース起点ディレクトリの明示が必要になったため。
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

### プログラムの作成と実行

`src/index.ts` を作成します。

```typescript {title="index.ts"}
const message: string = "Hello, world!";
console.log(message);
```

プロジェクトルートで、コンパイル(トランスパイル)を行います。

```console
$ npx tsc
```

`tsconfig.json` の設定に従って `.ts` ファイルがコンパイルされます。
`tsconfig.json` に指定した `include` に従い、ここでは `src` ディレクトリに `.js` ファイルが作成されます。

```javascript {title="index.js"}
const message = "Hello, world!";
console.log(message);
export {};
```

`JavaScript` ファイルは、 `Node.js` で実行できます。

```console
$ node dist/index.js
```

近年の Node.js(v22.6.0 以降)に「TypeScript をネイティブ実行できる機能(Type Stripping)」が標準搭載されたため、
`TypeSciprt` ファイルを、 `Node.js` で実行することもできます。

```console
$ node src/index.ts
```

`TypeScript` ファイルを `Node.js` で直接実行する場合、ファイルは生成されずインメモリで `JavaScript` が用意され実行されます。ただし、型チェックによるエラーは発生しません。 `tsc` を使ってコンパイルする場合は、型のチェックによる
エラーを見つけてくれます。

## 初めての `TypeScript`

### 型とは



### 文と式

- **文** (statement): プログラムの実行単位となる命令のこと。
- **式** (expression): 評価されて値になるコードの断片。

TypeScript の文は基本的にセミコロンで終わります。文は直接的な結果を持ちません。
式は何らかの計算を表し、計算の結果が式の結果となります。

式を実行したいが結果はいらないというときは、式文という文を使えます。
関数呼び出しは返り値という結果を伴うため、式となります。
`console.log()` のようにコンソールに文字列を表示したいが、その結果に興味はない場合は、
末尾にセミコロンを置いて式文として使うことができます。

> [!TIP] セミコロン(`;`)を付ける文と付けないブロック(`{}`)の違い
> - **単文・代入文** (末尾に `;` が必要):
>   `const x = 10;` や `console.log(x);` などの 1 つの命令文、および `const obj = { a: 1 };` や `const f = () => {};` のように変数へ代入している文は、末尾にセミコロン `;` を打ちます。
> - **構文ブロック** (末尾に `;` は不要):
>   `if`、`for`、`while`、`function`、`class` などで始まる構文は、閉じカッコ `}` で構文自体が完結するため、末尾に `;` は付けません。

### 変数宣言

```typescript
const 変数名 = 式;
```

変数に対して明示的に型名を指定することを型注釈(type annotation)と呼びます。

変数を定義する際に型注釈を加える場合は、以下のように記述します。

```typescript
const 変数: 型 = 式;
```

再代入可能な変数は、 `let` を使って宣言します。

```typescript
let greeting = "Hello";
```

再代入とはすでに宣言された変数に別の値を入れることです。

## プリミティブ型

- 文字列
- 数値(number)
- 真偽値
- 任意精度整数(BigInt)
- `null`
- `undefined`
- シンボル

### テンプレートリテラル

バッククォートで囲む文字列で文字列の中に改行をそのまま書ける、式を文字列の中に埋め込むことができるという記法です。

```typescript
const message: string = `Hello
world!`;
console.log(message);
```

```typescript
const str1: string = "Hello";
const str2: string = "world!";
console.log(`${str1}, ${str2}`);
```

### 真偽値リテラル

真偽値リテラルは、 `true` と `false` という値です。

### `null` と `undefined`

`null` と `undefined` はデータがないという状況を表す値です。

### 比較演算子と等価演算子

- **比較演算子**: `<`, `>`, `<=`, `>=`
- **等価演算子**: `==`, `!=`, `===`, `!==`

#### `==` と `===` の違い

JavaScript / TypeScript には 2 種類の等価演算子がありますが、**「型変換を行うかどうか」** に決定的な違いがあります。

- **`===`** (厳格等価演算子 / 推奨):
  - **「型」と「値」の両方が完全に一致しているか** を比較します。暗黙の型変換は行われません。
  ```typescript
  console.log(1 === 1);     // true
  console.log(1 === "1");   // false (数値と文字列で型が異なるため)
  console.log(0 === false); // false
  ```
- **`==`** (抽象等価演算子 / 非推奨):
  - 比較する値の型が異なる場合、**自動的に暗黙の型変換を行ってから比較** します。
  ```typescript
  console.log(1 == "1");    // true (文字列 "1" が数値 1 に変換されて比較される)
  console.log(0 == false);  // true (false が数値 0 に変換される)
  console.log("" == 0);     // true (空文字が数値 0 に変換される)
  ```

> [!WARNING] 原則として常に `===`(`!==`)を使用する
> `==` の暗黙の型変換ルールは非常に複雑で、予期せぬバグの温床になります。そのため、TypeScript / モダン JavaScript の開発では、原則として常に `===` および `!==` を使うのが鉄則です。

> [!TIP] `==` が例外的に使われるパターン
> 唯一の例外として、`x == null` と書くと「`x` が `null` または `undefined` のどちらかである」ことを 1 度に判定できます(`x === null || x === undefined` と同じ意味)。

### if文

条件分岐を行う最も基本的な構文です。条件式が `true` の場合にブロック内の処理を実行し、`else if` や `else` で複数の条件を連結できます。

```typescript
const score: number = 85;

if (score >= 90) {
  console.log("評価: S (大変優秀です)");
} else if (score >= 70) {
  console.log("評価: A (合格です)");
} else {
  console.log("評価: B (再挑戦しましょう)");
}
```

### switch文

1 つの値に対して複数の候補(`case`)をマッチさせて分岐させる構文です。値の種類が多い場合に `if` 文よりもスッキリ記述できます。

```typescript
const role: string = "editor";

switch (role) {
  case "admin":
    console.log("管理者権限: すべての操作が可能です");
    break;
  case "editor":
    console.log("編集者権限: 記事の作成・編集が可能です");
    break;
  case "viewer":
    console.log("閲覧者権限: 閲覧のみ可能です");
    break;
  default:
    console.log("不明な権限です");
    break;
}
```

> [!TIP] `break` の重要性
> 各 `case` の末尾に `break;` を書き忘れると、一致した `case` 以降の処理も続けて実行されてしまう(フォールスルー現象)ため注意が必要です。

### while文

指定した条件式が `true` である間、ブロック内の処理を繰り返し実行する構文です。

```typescript
let count: number = 0;

while (count < 5) {
  console.log(`現在のカウント: ${count}`);
  count++;
}
```

> [!WARNING] 無限ループに注意
> ループの中で条件式を更新する処理(`count++` など)を書き忘れると、条件が永遠に `true` のままとなり「無限ループ」が発生してプログラムがフリーズしてしまいます。

### break文とcontinue文

ループ処理の流れを制御するための特別な命令です。

#### `break` 文(ループの中断・脱出)
条件を満たした時点で **ループ処理そのものを完全に終了** させ、ループの外へ抜けます。

```typescript
let i: number = 0;

while (i < 10) {
  if (i === 3) {
    console.log("3 に達したためループを中断します");
    break; // ループを即座に終了
  }
  console.log(`i = ${i}`);
  i++;
}
// 出力結果: i = 0, i = 1, i = 2, 3 に達したためループを中断します
```

#### `continue` 文(現在の周をスキップ)
ループ内の残りの処理をスキップし、**次の周回(イテレーション)へジャンプ** します。

```typescript
let i: number = 0;

while (i < 5) {
  i++;
  if (i === 3) {
    console.log("3 をスキップします");
    continue; // これ以降の処理を飛ばして次のループへ
  }
  console.log(`i = ${i}`);
}
// 出力結果: i = 1, i = 2, 3 をスキップします, i = 4, i = 5
```

> - **`break`**: ループを **「完全に終了」** して脱出する
> - **`continue`**: 今回の周だけを **「スキップ」** して次の周へ進む

### for文

繰り返す回数があらかじめ決まっている場合に最もよく使われる構文です。「初期化式」「条件式」「更新式」を 1 行にまとめて記述します。

```typescript
for (let i: number = 0; i < 5; i++) {
  console.log(`インデックス: ${i}`);
}
// 出力結果: インデックス: 0, 1, 2, 3, 4
```

- **初期化式** (`let i = 0`): ループ開始時に 1 度だけ実行される変数宣言。
- **条件式** (`i < 5`): 各ループの開始時に判定され、`true` の間繰り返す。
- **更新式** (`i++`): 各ループの終了時に実行されるカウントアップ。

> [!TIP] 配列の反復処理には `for...of` 文も便利
> 配列の要素を 1 つずつ順番に取り出して処理したい場合は、`for...of` 構文を使うとインデックスを意識せずスッキリ記述できます。
> 
> ```typescript
> const fruits: string[] = ["りんご", "バナナ", "みかん"];
> for (const fruit of fruits) {
>   console.log(fruit);
> }
> ```

## オブジェクト

### オブジェクトと連想配列の捉え方

よく「JavaScript / TypeScript のオブジェクトは連想配列(辞書/マップ)である」と説明されることがありますが、概念としては明確に区別して整理するのが自然です。

1. **オブジェクトはオブジェクトである**:
   - プロパティ名(キー)と値(バリュー)のペアをまとめ、特定のデータ構造を表現するための独立した複合データ型です。
2. **連想配列とは何か?**:
   - 「任意のキーに対して値を紐付け、動的にキーを登録・検索・更新できるデータ構造(コレクション)」という概念です。
3. **連想配列に求める要件はオブジェクトで実現できる**:
   - オブジェクトはプロパティアクセス(`obj["key"]`)を持っているため、連想配列に求められる「キーで値を検索・格納する」という用途は、オブジェクトの機能を使うことで十分に実現できました。
4. **なぜ連想配列用の別型を導入しなかったのか?**:
   - JavaScript の歴史上、オブジェクト自体が非常に柔軟だったため、わざわざ専用の連想配列型を新設しなくても、オブジェクトの流用で十分実用を満たせていたという背景があります。
5. **明示的な連想配列型の導入**:
   - しかし、「固定の構造を持つ通常のオブジェクト」と「動的にキーが増減する連想配列」を混同して扱うと、型安全性やコードの意図が曖昧になります。
   - そこで、「連想配列として使う場合は明示的な型を用意した方が安全である」という考えのもと、TypeScript では **インデックスシグネチャ** (`{ [key: string]: number }`)や **`Record<Keys, Type>`** 型が用意されています(現代の JavaScript にも専用の `Map` オブジェクトが導入されています)。

### オブジェクトの型

```typescript
const obj = {
  foo: 123,
  bar: "Hello world!"
};
```

オブジェクトにも型があります。上記のオブジェクト(`obj`)を用意した場合、このオブジェクトの型は以下になります。

```typescript
const obj: {
  foo: number;
  bar: string;
}
```

オブジェクト型の構文は、 `プロパティ名: 型;` という宣言を `{ }` の中に並べるという形をしています。

型に名前(別名)を付けるには `type` 文を使います。

```typescript
type FooBarObj = {
  foo: number;
  bar: string;
};

const obj: FooBarObj = {
  foo: 123,
  bar: "Hello, world!"
};
```

`type` 文を使うことでプリミティブの型にも別名を付けることも可能です。

```typescript
type UserId = string;
const id: UserId = "uhyo";
```

type文では任意の型に対して別名を付けることが可能ですが、オブジェクト型には `interface` 宣言を使うこともできます。
`interface` 宣言の構文は、 `interface 型名 オブジェクト型` です。

```typescript
inteface FooBarObj {
  foo: number;
  bar: string;
}

const obj: FooBarObj = {
  foo: 0,
  bar: "string"
};
```

ほとんどの場合 `interface` 宣言は `type` 文で代表可能です。

### インデックスシグネチャ

オブジェクト型の中で使用できる特殊な記法であり、どんな名前のプロパティも受け入れるという
性質のオブジェクト型を記述することができます。

プロパティ名を動的に決めたいときに使えます。

```typescript
type PriceData = {
  [key: string]: number;
}

const data: PriceData = {
  apple: 220,
  coffee: 120,
  bento: 500
};

data.chicken = 250;
data.bento = "foo"; // Type "foo" is not assignable to type 'number'.
```

### オプショナルなプロパティの宣言

オプショナルなプロパティは、あってもなくてもよいプロパティのことです。
プロパティ名の後ろに `?` を付けて宣言します。

```typescript
type MyObj = {
  foo: boolean;
  bar: boolean;
  baz?:number;
}

const obj: MyObj = {foo: false, bar: true};
const obj2: MyObj = {foo: true, bar: false, baz: 1234};
```

### 読み取り専用プロパティの宣言

プロパティ名の前に `readonly` を付与することで読み取り専用プロパティを宣言することができます。

```typescript
type MyObj = {
  readonly foo: number;
}

const obj: MyObj = {foo: 123};
obj.foo = 0; // Cannot assign to 'foo' because it is a read-only property.
```

### 変数の型を得る `typeof`

`typeof 変数名` でその変数が持つ型を表示することができます。

```typescript
const num: number = 0;
type T = Typeof num;
const foo: T = 123;
```

### 型引数を持つ型

```typescript
type User<T> = {
  name: string;
  child: T;
};
```

複数の型引数を持つ型は、次のように宣言します。

```typescript
type Family<Parent, Child> = {
  mother: Parent;
  father: Parent;
  child: Child;
};
```

### 型引数を持つ型を使用する

```typescript
const obj: Family<number, string> = {
  mother: 0,
  father: 100,
  child: 100
};
```

### オプショナルな型引数

```typescript
type Animal = {
  name: string;
}

type Family<Parent = Animal, Child = Animal> = {
  mohter: Parent;
  father: Parent;
  child: Child;
}
```

省略された部分は、 `=` で指定された型であるデフォルト値が渡された物として扱われます。

```typescript
type S = Family<string, string>;
type T = Family;
type U = Family<string>;
```

## 配列(`Array`)

`TypeScript` の値はプリミティブかオブジェクトの 2 種類しか無く、配列はプリミティブではないため
必然的にオブジェクトとなります。

```typescript
const attr = [0, 123, -456 * 100];
console.log(arr);
```

`TypeScript` では配列に複数種類の型を同時に入れることができます。

```typescript
const attr2 = [100, "文字列", false];
```

配列リテラルの中でもスプレッド構文を利用することができます。

```typescript
const arr1 = [4, 5, 6];
const arr2 = [1, 2, 3, ...arr1];
console.log(arr2);  // [1, 2, 3, 4, 5, 6] が表示される
```

### 配列の型

配列の型は `型[]` という特殊な構文で表されます。 `[]` の前にある型は、配列の要素の型です。

```typescript
const arr: number[] = [1, 10, 100];
```

### 読み取り専用配列型

```typescript
const attr: readonly number[] = [1, 10, 100];

arr[1] = -500; // index signature in type 'readonly number[]' only permits reading.
```

### 配列のメソッドとプロパティ

#### push

```typescript
const arr = [1, 10, 100];
arr.push(1000);
console.log(arr); // [1, 10, 100, 1000]

arr.push("foobar"); // Argument of type "foobar" is not assignable to parameter of type 'number'.
```

`arr` は、暗黙的に `number[]` 型の要素になっているので、文字列を `push` するとエラーになります。

`push` を読み取り専用の配列型に使おうとすると、コンパイルエラーが発生します。

```typescript
const arr: readonly number[] = [1, 10, 100];
arr.push(1000); // Property 'push' does not exist on type 'readonly number[]'.
```

#### includes

配列が与えられた値を含んでいるかどうかを真偽値で返すメソッドです。

```typescript
const arr = [1, 10, 100];
console.log(arr.includes(100)); // true
console.log(arr.includes(50)); // false
console.log(arr.includes("foobar")); // Argument of type "foobar" is not assignable to parameter of type 'number'.
```

#### lengthプロパティ

```typscript
const arr = [1, 10, 100];
console.log(arr.length); // 3
arr.push(1000);
console.log(arr.length); // 4
```

### `for-of` 文によるループ

```typescript
const arr = [1, 10, 100];

for (const elm of arr) {
  console.log(elm);
}
```

### タプル型

タプル型は要素数が固定化された配列型です。

```typescript
let tuple: [string, number] = ["foo", 0];
tuple = ["aiueo", -555];
```

## 分割代入

オブジェクトから値を取り出して変数に代入する操作を簡単に書くことができます。

```typescript
const {foo, bar} = obj;
```

`obj` の `foo` と `bar` プロパティを、 `foo` 、 `bar` 変数に代入することを意味します。

```typescript
const nested = {
  num: 123,
  obj: {
    foo: "hello";
    bar: "world";
  }
};

const {num, obj: {foo}} = nested;
console.log(num); // 123
conosle.log(obj); // "hello"
```

配列の分割代入もできます。

```typescript
const arr = [1, 2, 4, 8, 16, 32];
const [first, second, third] = arr;
const.log(first); // 1
const.log(sedond); // 2
const.log(third); // 4
```

## その他の組み込みオブジェクト

### `Date` オブジェクト

```typescript
let d = new Date();
console.log(d);

d = new Date("2020-02-03T15:00:00+09:00");
console.log(d);

const timeNum = date.getTime();
console.log(timeNum);

const date2 = new Date(timeNum);
console.log(date2);

console.log(Date.now());
```

### 正規表現オブジェクト

```typescript
const r = /ab+c/;

console.log(r.test("abbbbc"));
console.log(r.test("Hello, abc world!"));
console.log(r.test("ABC"));
console.log(r.test("こんにちは"));

console.log("Hello, abbbbbbbc world! abbc".replace(/ab+c/, "foobar"));
console.log("Hello, abbbbbbbc world! abbc".replace(/ab+c/g, "foobar"));

const result = "Hello, abbbbbbbc world! abc".match(/a(b+)c/);
if (result !== null) {
  console.log(result[0]);
  console.log(result[1]);
}

const result = "Hello, abbbbbbbc world! abc".match(/a(?<worldName>b+)c/);
if (result !== null) {
  console.log(result.groups);
}
```

### Mapオブジェクト・Setオブジェクト

`Map` は連想配列を表すオブジェクトです。

```typescript
const map: Map<string, number> = new Map();
map.set("foo", 1234);

console.log(map.get("foo")); // 1234
console.log(map.get("bar")); // undefined
```

`Set` は集合を表すオブジェクトです。

`add` メソッドで値を集合に追加したり、 `delete` メソッドで値を取り除いたりすることができます。

値が現在の `Set` 内に存在するかは `has` メソッドで調べることができます。

## 関数

```typescript
function range(min: number, max: number): number[] {
  const result = [];
  for (let i = min; i <= max; i++) {
    result.push(i);
  }
  return result;
}

console.log(range(5, 10));
```

### 返り値がない関数

```typescript
function helloWorldNTimes(n: number): void {
  for (let i = 0; i < n; i++) {
    console.log("Hello, world!");
  }
}

helloWorldNTimes(5);
```

関数の実行を途中で中断させる際に、 `return` 文を使う場合は、 `return;` と書きます。

### 関数式

式を使って関数を作れます。

```typescript
type Human = {
  height: number;
  weight: number;
};

const calcBMI = function(human: Human): number {
  return human.weight / human.height ** 2;
};

const uhyo: Human = {height: 1.84, weight: 72};

console.log(calcBMI(uhyo));
```

分割代入を行う場合は次のようにします。

```typescript
type Human = {
  height: number;
  weight: number;
};

const calcBMI = function({height, weight}: Human): number {
  return weight / height ** 2;
};

const uhyo: Human = {height: 1.84, weight: 72};
console.log(calcBMI(uhyo));
```

### アロー関数式

```typescript
type Human = {
  height: number;
  weight: number;
};

const calcBMI = ({
  height, weight
}: Human): number => {
  return weight / height ** 2;
};

const uhyo: Human = {height: 1.84, weight: 72};
console.log(calcBMI(uhyo));
```

アロー関数式の省略系は次のように記載します。

```typescript
const calcBMI = ({
  height, weight
}: Human): number => {
  return weight / height ** 2;
};

const calcBMI = ({
  height, weight
}: Human): number => weight / height ** 2;
```

関数本体の `{}` と `return` の記述を省くことができます。

### メソッド記法で関数を作る

```typescript
const obj = {
  // メソッド記法
  double(num: number): number {
    return num * 2;
  },

  // 通常の記法 + アロー関数
  double2: (num: number): number => num * 2,
};

console.log(obj.double(100));
console.log(obj.double2(-50));
```

### コールバック関数

関数の引数として渡す関数をコールバック関数と呼びます。

```typescript
type User = {name: string; age: number};
const getName = (u: User): string => u.name;
const users: User[] = [
  {name: "uhyo", age: 26},
  {name: "John Smith", age: 15}
];

const names = users.map(getName);
console.log(names); // ["uhyo", "John Smith"]
```

コールバック関数を引数として受け取るような関数は高階関数(higher-order function)と呼ばれることがあります。

## クラス

```typescript
class User {
  name: string = "";
  age: number = 0;
}

const uhyo = new User();
console.log(uhyo.name);
console.log(uhyo.age);

uhyo.age = 26;
console.log(uhyo.age);
```

メソッドを宣言するには、クラス宣言の中にメソッドの宣言を書きます。

```typescript
class User {
  name: string = "";
  age: number =0;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  isAdult(): boolean {
    return this.age >= 20;
  }

  setAge(newAge: number) {
    this.age = newAge;
  }
}

const uhyo = new User();
console.log(uhyo.isAdult());

uhyo.setAge(26);
console.log(uhyo.isAdult());
```

## 例外処理

```typescript
try {
  console.log("エラーを発生させます");
  throwError();
  console.log("エラーを発生させました");
} catch (err) {
  console.log("エラーをキャッチしました");
  console.log(err);
}
console.log("おわり ");

function throwError() {
  const error = new Error(" エラーが発生しました!!!!!");
  throw error;
}
```

## ユニオン型とインターセクション型

### ユニオン型

```typescript
type Animal = {
  species: string;
};

type Human = {
  name: string;
}

type User = Animal | Human;

const tama: User = {
  species: "Felis silvestris catus"
}

const uhyo: User = {
  name: "unyo"
};
```

### インターセクション型
 
```typescript
type Animal = {
  species: string;
  age: number;
}

type Human = Animal & {
  name: string;
}

const tama: Animal = {
  species: "Felis silvestris catus",
  age: 3
};

const uhyo: Human = {
  species: "Homo sapiens sapiens",
  age: 26,
  name: "uhyo"
};
```

## `TypeScript` のモジュールシステム

```typescript {title="uhyo.ts"}
export const name = "uhyo";
export const age = 26;
```

```typescript {title="index.ts"}
import { name, age } from "./uhyo.js";
console.log(name, age);
```

モジュール名は一般的なファイルパス(普通は相対パス)の記法を用います。
ただし、末尾に拡張子 `.js` を付ける必要があります。

理由は、 `.ts` ファイルをトランスパイルすると `.js` ファイルが出力され
`import` ではトランスパイル後のファイル名を指定する必要があるからです。

### `DefinitelyTyped` と `@types`

`TypeScript` 向けの型定義が同梱されていないパッケージはそれだけをインストールしても
コンパイルエラーが発生します。

`express` パッケージは `JavaScript` のパッケージであり、 `TypeScript` の型定義は同梱されていません。

有志が `@types/express` パッケージとして型情報を提供しているので、
`npm install -D @types/express` として導入することで利用できるようになります。

`@types` パッケージの開発・運用は `Microsoft` が運営する `DefinitelyTyped` というシステムに
集約されています。

`@types` パッケージの中身を作るのはコミュニティの有志ですが、それをレビューしたり
実際にパッケージとして `npm` に公開したりといった作業は `DefinitelyTyped` を
介して行います。

## 非同期処理

非同期処理の実行開始時に「終了したら呼び出される関数」を登録しておき、非同期処理が完了したら
その関数が呼び出されるようにするのがコールバック関数です。

### `async/await` 構文

```typescript
async function get3(): Promise<number> {
  return 3;
}
```

`get3` 関数は「3を結果とする `Promise` 」を返す関数です。

`await` は「与えられた `Promise` の結果が出るまで待つ」というものです。




### 参考

- プロを目指すためのTYPESCRIPT入門 安全なコードの書き方から高度な型の使い方
- 現場で使えるTypeScript詳解実践ガイド