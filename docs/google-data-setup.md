# GA4 / Search Console 実データ連携セットアップ

サービスアカウント方式で、GA4（Googleアナリティクス）と Search Console の実データを取得します。
コードは実装済み。以下は **Google 側の設定**（利用者の作業）です。

## 1. Google Cloud プロジェクトと API
1. https://console.cloud.google.com/ でプロジェクトを作成（または選択）。
2. 「APIとサービス」→「ライブラリ」で次を **有効化**：
   - **Google Analytics Data API**
   - **Google Search Console API**

## 2. サービスアカウントの作成
1. 「APIとサービス」→「認証情報」→「認証情報を作成」→「サービスアカウント」。
2. 作成後、そのサービスアカウントを開き「キー」→「鍵を追加」→「新しい鍵を作成」→ **JSON** をダウンロード。
3. JSON 内の `client_email` と `private_key` を後で使います。

## 3. アクセス権の付与
- **GA4**：GA4 管理画面 → 管理 → プロパティの「プロパティのアクセス管理」→ サービスアカウントの `client_email` を **「閲覧者」** で追加。
- **Search Console**：対象プロパティ → 設定 → ユーザーと権限 → サービスアカウントの `client_email` を追加（フル/制限どちらでも可）。

## 4. ID の確認
- **GA4 プロパティID**（数値・例 `123456789`）：GA4 管理 → プロパティ設定。※ 測定ID `G-XXXX` ではありません。
- **Search Console サイトURL**：プロパティと **完全一致**させる必要があります。
  - URLプレフィックス型：`https://example.com/`（末尾スラッシュ含む）
  - ドメイン型：`sc-domain:example.com`

## 5. `.env.local` に認証情報を設定
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxx@xxxx.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...(JSONのprivate_keyをそのまま)...\n-----END PRIVATE KEY-----\n"
```
- `private_key` は JSON 内の値（`\n` を含む）を **そのまま** ダブルクオートで囲んで貼り付けます。
- `.env.local` は Git 管理外（コミットされません）。
- 変更後は開発サーバーを再起動：`npm run dev`

## 6. 使い方
1. アプリの **データ連携** 画面を開く。
2. 「Google 連携（実データ取得）」で
   - GA4 に **プロパティID（数値）** を入力 →「保存して同期」
   - Search Console に **サイトURL** を入力 →「保存して同期」
3. もしくは右上の **「今すぐ同期」** で両方まとめて取得。
4. 「連携中のサービス」カードと、ダッシュボードのデータ連携に **実数値（PV/UU/CV・検索順位/CTR）** が反映されます。

## うまくいかない時
- **権限がありません(403)**：サービスアカウントのメールを GA4 / Search Console に追加したか確認。
- **見つかりません(404)**：プロパティID（数値）/ サイトURL（完全一致）を確認。
- 取得は最新化のたびに `last_sync` が更新されます。

## 補足（現スコープ）
- 今回反映するのは **データ連携カードの数値** まで。
- ダッシュボードの主要KPI（売上・利益・問い合わせ等）は当面サンプル表示です（別フェーズで実データ化予定）。
- Vercel 等にデプロイする場合は、同じ環境変数をデプロイ先にも設定してください。
