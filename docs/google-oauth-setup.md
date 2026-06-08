# GA4 / Search Console 連携（OAuth）セットアップ

ユーザーはダッシュボードの「**Google で連携**」ボタンを押すだけで連携できます。
以下は **運営者（あなた）が一度だけ** 行う準備です（利用者は env を触りません）。

## 1. Google Cloud で API を有効化
https://console.cloud.google.com/ のプロジェクトで以下を有効化：
- **Google Analytics Data API**
- **Google Analytics Admin API**（プロパティ一覧の取得に使用）
- **Google Search Console API**

## 2. OAuth 同意画面（テストモード）
1. 「APIとサービス」→「OAuth 同意画面」→ User Type: **External** → 作成。
2. スコープに追加：`.../auth/analytics.readonly`、`.../auth/webmasters.readonly`、`.../auth/userinfo.email`。
3. 公開ステータスは **Testing** のまま。**「テストユーザー」に利用者のGoogleアカウントを登録**（最大100人）。
   - テストユーザーは「このアプリは確認されていません」画面で「続行」すれば利用可能。
   - 一般公開（誰でも）にする場合は別途 Google の審査が必要。

## 3. OAuth クライアント（ウェブ）を作成
1. 「認証情報」→「認証情報を作成」→「OAuth クライアント ID」→ アプリの種類: **ウェブアプリケーション**。
2. **承認済みのリダイレクト URI** に追加：
   - ローカル: `http://localhost:3000/api/google/callback`
   - 本番（デプロイ後）: `https://あなたのドメイン/api/google/callback`
3. 発行された **クライアントID** と **クライアントシークレット** を控える。

## 4. Supabase サービスロールキー
Supabase ダッシュボード → Project Settings → API → **service_role**（secret）をコピー。
連携トークンをサーバー専用テーブルに安全に保存するために使います。

## 5. `.env.local` に設定
```
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/google/callback
SUPABASE_SERVICE_ROLE_KEY=...   # サーバー専用・絶対に公開しない（NEXT_PUBLIC_ を付けない）
```
- 設定後は開発サーバーを再起動：`npm run dev`
- `.env.local` は Git 管理外（コミットされません）

## 6. 使い方（利用者の操作・すべてダッシュボード内）
1. **データ連携** 画面で「**Google で連携**」→ Google ログイン・許可。
2. 戻ると「連携済み: メール」と表示され、
   - **GA4 プロパティ** をドロップダウンから選択 →「保存して同期」
   - **Search Console サイト** をドロップダウンから選択 →「保存して同期」
3. 右上「**今すぐ同期**」で最新化。カードとダッシュボードに実数値（PV/UU/CV・検索順位/CTR）が反映。
4. 「**連携解除**」でいつでも解除可能。

## セキュリティ
- 連携トークンは `google_oauth` テーブル（**RLSポリシー無し**）に保存し、**ブラウザからは一切読めません**。
  サーバー側のサービスロールクライアントのみがアクセスします。
- 将来的な強化：トークンの暗号化（Supabase Vault）。

## デプロイ時（次フェーズ）
- 本番ドメインのコールバックURLを OAuth クライアントへ追加。
- デプロイ先（Vercel等）に同じ環境変数を設定。`GOOGLE_OAUTH_REDIRECT_URI` を本番URLに。
