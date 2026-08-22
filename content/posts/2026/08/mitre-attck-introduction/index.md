---
date: '2026-08-16T11:46:00Z'
draft: false
title: 'MITRE ATT&CK の基本構造と防御視点での活用メモ'
description: 'サイバー攻撃者の行動パターンを体系化したナレッジベース「MITRE ATT&CK」の TTPs 階層構造、ドメイン、DeTT&CT や D3FEND など周辺ツールを活用した検知設計の整理。'
tags: ["security", "mitre", "attck", "threat-intelligence", "dettect", "d3fend"]
categories: ["Tech", "Security"]
---

## はじめに

サイバー攻撃者の侵入後行動（Post-compromise behavior）を体系化したナレッジベース、**MITRE ATT&CK** について、その基本構造と防御側（ブルーチーム）での活用方法をまとめます。

---

## コア要素：TTPs の階層構造

ATT&CK は **TTP（Tactics, Techniques, Procedures）** の階層構造で攻撃手法を整理しています。

| 階層 | 意味 | 具体例 |
| :--- | :--- | :--- |
| **Tactics（戦術）** | 攻撃者の目的（Why） | 初期侵入、権限昇格、横展開、情報窃取 |
| **Techniques（手法）** | 目的を達成する具体的なやり方（How） | OS Credential Dumping, Process Injection |
| **Sub-techniques** | 手法のより詳細な分類 | LSASS Memory (T1003.001) |
| **Procedures（事例）** | 実際の攻撃グループの実行記録 | APT29 が Mimikatz でメモリから認証情報を抽出 |

---

## 対象ドメインの分類

ATT&CK は対象環境に応じて 3 つのドメインに分かれています。

- **Enterprise**: Windows, Linux, macOS, AWS/Azure/GCP, Active Directory などの一般的な企業環境
- **Mobile**: Android, iOS などのモバイルプラットフォーム
- **ICS**: 工場や社会インフラ（SCADA, PLC）などの産業制御システム

---

## 防御側のマッピング情報

単なる攻撃カタログではなく、各テクニックに対抗するための防御情報が紐づいています。

- **Data Sources**: 検知に必要なログ種別（Process Creation, Network Traffic 等）
- **Detection**: 検知ロジック・シグネチャ作成の指針
- **Mitigations**: リスクを予防するための設定（MFA, 最小権限 等）

---

## 周辺エコシステムと関連ツール

- **ATT&CK Navigator**: マトリクスをブラウザ上でヒートマップ表示・レイヤー比較できる公式ツール。
- **DeTT&CT**: 収集ログと検知ルールから、防御体制の死角（カバレッジの穴）をスコアリングするフレームワーク。
- **D3FEND**: ATT&CK の各攻撃手法に対応する「防御技術」を体系化したオントロジー。
- **mitreattack-python**: STIX 形式のデータをプログラムから操作するための公式 Python ライブラリ。

> ※ 本記事の構成検討・技術仕様の検証・Hugo による静的ビルド検証・推敲は、AI コーディングエージェントとの自律協働ループによって執筆・検証されています。
