# NovelFlow — Firebase Firestore リアルタイム共有・永続化プラン

開発環境（`ais-dev-...`）と公開・共有URL（`ais-pre-...`）の間でサーバーコンテナが分離されていることにより、ローカルファイル保存（`data/novels.json`）の投稿作品が共有URL側に反映されない問題を解決します。**Firebase Firestore** を導入し、投稿された作品・いいね数・フレーズハイライトをすべてのURL・すべての端末間でリアルタイムに同期・永続化します。

---

## User Review & Critical Decisions

> [!IMPORTANT]
> 以下のユーザー確認事項に基づき設計しています。プラン承認後、Firebaseのプロビジョニング（セットアップ承認画面の表示）を実行し、データベースとセキュリティルールを自動構成します。

- **Confirmed Decision 1（対象環境）**: AI Studioの開発画面（`ais-dev-...`）と共有URL（`ais-pre-...`）の双方で、同一のクラウドデータを参照・更新できるようにします。
- **Confirmed Decision 2（データベース選定）**: **Firebase Firestore** を導入し、作品データ（短編・連載小説）、作品へのいいね状態、フレーズハイライトをリアルタイム共有します。
- **Security & Validation**: 先ほど導入した **DOMPurify によるXSSサニタイズ** および **Zod スキーマ検証** に加え、Firestore 側でも厳格な **Zero-Trust セキュリティルール (`firestore.rules`)** を適用し、不正なデータ書き込みをブロックします。

---

## 1. Overview & Core Concept

- **What It Does**:
  - ユーザーが「作品を投稿」から新しいショート小説または通常小説を公開すると、即座にクラウド上の **Firebase Firestore** に保存され、共有URL（`ais-pre-...`）や別デバイスのブラウザでもリロード不要（`onSnapshot` リアルタイム購読）またはアクセス時に即座に反映されます。
  - 初期サンプル作品（ショート10作品・長編5作品）に加え、開発環境ですでに作成された投稿データも自動的に Firestore へ初期シード（移行）されるため、既存の作品が消えることはありません。
- **Target Audience / Persona**:
  - ポートフォリオとして共有URL（`ais-pre-...`）を採用担当者や第三者に公開し、実際に作品を投稿・閲覧・いいねして試してもらうクリエイターおよびレビュアー。
- **Key Value**:
  - コンテナの再起動や再デプロイ、環境の違い（Dev / Shared URL）に左右されない、本番グレードのクラウド永続化とリアルタイム同期を実現します。

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **初回起動・シームレス同期**: アプリを開くと Firestore から最新の投稿作品リスト・いいね数・フレーズハイライトをリアルタイム購読し、既存の15作品＋ユーザー投稿作品を即座に表示します。
  2. **作品の投稿フロー**: モーダルからタイトル・あらすじ・各ページ本文を入力して「作品を投稿する」を押すと、クライアントでの DOMPurify サニタイズ＆Zod検証を経て Firestore の `novels` コレクションへ永続化され、共有URL側にも即座に反映されます。
  3. **いいね＆フレーズハイライト共有**: 作品への「いいね」や本文中の「フレーズいいね」も Firestore 上で管理され、共有URLを開いた際にも最新のいいね数・ハイライトが維持されます。
- **Visual Identity & Theme**:
  - 既存の「深いエメラルド＆黒曜石（`#070d0a` / `#0c1812`）× 羊皮紙リーダー（Parchment Card）」の世界観・UI・操作感を100%維持します。
  - 作品カードのメタデータは視覚的なノイズを抑え、タイポグラフィの階層（明朝体見出し `Noto Serif JP` とサンセリフUI `Inter / Noto Sans JP`）を活かしたクリーンなレイアウトを保ちます。
- **Interactive Feedback & Motion**:
  - 投稿完了時やいいね操作時にはオプティミスティックUI更新（即時反映）を行いつつ、バックグラウンドで Firestore と同期し、万が一の通信エラー時には分かりやすいトースト・エラーバナーで通知します。

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Firestore リアルタイム購読 + サーバー/ローカルフォールバックのハイブリッド構成**
  - *Chosen Approach*: Firestore SDK（`onSnapshot`, `setDoc`, `updateDoc`, `deleteDoc`）をプライマリデータストアとして使用しつつ、既存の Express API（`/api/novels`）およびローカルキャッシュとも透過的に連携します。
  - *Why*: 共有URL・別端末間での即時共有を確実に実現しながら、オフライン時やネットワーク瞬断時にもアプリが停止しない高い可用性を担保するためです。
- **Decision 2: 多層防御セキュリティ（DOMPurify + Zod + Firestore Security Rules）**
  - *Chosen Approach*: クライアント送信前のサニタイズ＆Zod検証に加え、`firestore.rules` 側でもフィールド型・文字数上限・必須キーの検証ルールを定義してデプロイします。
  - *Why*: ポートフォリオとしてコードレビューを受けた際にも、フロントエンド・API・データベースルールの全レイヤーで堅牢なセキュリティ設計を示すことができます。

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        NovelFlow Client (React / Vite)                     │
│                                                                            │
│  ┌──────────────────┐   ┌──────────────────────┐   ┌────────────────────┐  │
│  │   HomePage /     │   │  NovelViewer /       │   │   PublishModal     │  │
│  │   Explore / Lib  │   │  RegularNovelViewer  │   │ (Zod + DOMPurify)  │  │
│  └────────┬─────────┘   └──────────┬───────────┘   └─────────┬──────────┘  │
│           │                        │                         │             │
│           ▼                        ▼                         ▼             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │        Data Access Layer (useNovelFeed / usePhraseBookmark)          │  │
│  │        + XSS Sanitizer (isomorphic-dompurify) & Zod Schemas          │  │
│  └─────────────────────────────────┬────────────────────────────────────┘  │
└────────────────────────────────────┼───────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼ (Primary: Real-time Cloud Sync)       ▼ (Fallback / API)
┌─────────────────────────────────────┐ ┌────────────────────────────────────┐
│      Firebase Cloud Firestore       │ │   Express Backend (server.ts)      │
│  (Shared across Dev & Public URLs)  │ │  + express-rate-limit + Zod        │
│                                     │ │                                    │
│  • /novels/{novelId}                │ │  • POST /api/novels                │
│  • /novel_likes/{likeId}            │ │  • POST /api/phrase-likes          │
│  • /phrase_likes/{phraseLikeId}     │ │  • POST /api/generate (Gemini API) │
└─────────────────────────────────────┘ └────────────────────────────────────┘
```

### Data Model & Firestore Collections

1. **`/novels/{novelId}`（投稿作品コレクション）**
   - `id`, `title` (1〜120文字), `synopsis` (0〜1000文字), `author_id`, `author` (`{ id, username, avatar_url }`), `type` (`'short' | 'regular'`), `category`, `status` (`'published'`), `likesCount`, `commentsCount`, `tipsTotal`, `pages` (各章・各ページの配列), `created_at` (ISO文字列)
2. **`/novel_likes/{likeDocId}`（ユーザーごとの作品いいね状態）**
   - `novelId`, `userId`, `createdAt`（いいね増減時に `/novels/{novelId}` の `likesCount` もトランザクション／バッチで同期更新）
3. **`/phrase_likes/{phraseLikeId}`（フレーズハイライト保存コレクション）**
   - `id`, `userId`, `novelId`, `novelTitle`, `novelCategory`, `authorName`, `pageNumber`, `chapterTitle`, `phrase` (1〜500文字), `surroundingContext` (0〜500文字), `createdAt`

### Interactive Component & State Mapping

- **Firebase Provisioning & Initialization**:
  - Firebase プロビジョニングツールを実行して `firebase-applet-config.json` を生成し、`firebase-blueprint.json` と `firestore.rules` を設計・デプロイします。
- **Real-time Novel Feed (`useNovelFeed`)**:
  - Firestore の `/novels` コレクションを購読し、新規投稿やいいね数の変化を Dev URL と Shared URL の間でリアルタイムに反映します。
- **Phrase Highlight Sync (`usePhraseBookmark`)**:
  - Firestore の `/phrase_likes` コレクションと連携し、フレーズハイライトの追加・削除をクラウドへ永続化します。
