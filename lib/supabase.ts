// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database, Profile, Novel, NovelPage, NovelWithDetails } from '@/types/database';

const getEnvVar = (nextKey: string, viteKey: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[nextKey]) {
    return process.env[nextKey] as string;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    // @ts-ignore
    return import.meta.env[viteKey] as string;
  }
  return '';
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = createClient<Database>(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);

/* =========================================================================
   サンプル小説（ショート10本 ＋ 通常小説5本）
   ========================================================================= */

export const INITIAL_SHORT_NOVELS: NovelWithDetails[] = [
  {
    id: 'short-1',
    author_id: 'author-1',
    title: '深夜3時の自動販売機',
    synopsis: '街外れの古い自販機には、誰も知らない真っ白な秘密のボタンがあった。',
    status: 'published',
    type: 'short',
    category: 'ファンタジー',
    created_at: '2026-03-10T12:00:00Z',
    author: {
      id: 'author-1',
      username: '星野 蓮',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 89,
    tipsTotal: 2500,
    pages: [
      {
        id: 'p-s1-1',
        novel_id: 'short-1',
        page_number: 1,
        content: `午前3時14分。
街のすべての灯りが死に絶えた頃、私はその自動販売機の前に立っていた。

青白い蛍光灯が、湿ったアスファルトを冷たく照らしている。
缶コーヒー、緑茶、炭酸水。
どこにでもあるラインナップの最下段、右端。

そこには、値札も商品名もない、真っ白なプラスチックのボタンがひとつだけあった。`,
      },
      {
        id: 'p-s1-2',
        novel_id: 'short-1',
        page_number: 2,
        content: `「百円を入れると、失くした記憶が缶に入って出てくる」

噂を信じていたわけではない。
ただ、昨日彼女が残していった合鍵の重みに耐えかねて、宛てもなく歩いていただけだった。

ポケットから取り出した百円玉を投入口に滑り込ませる。
カラン、と乾いた音が夜気によく響いた。

私はためらうことなく、あの白いボタンを押し込んだ。`,
      },
      {
        id: 'p-s1-3',
        novel_id: 'short-1',
        page_number: 3,
        content: `ゴトン――。

重い音とともに、取り出し口に転がり落ちてきたのは、冷たく結露した無地の銀色の缶だった。
プルタブに指をかけ、静かに引く。
プシュッという炭酸の抜ける音とともに、甘い金木犀の香りが立ちのぼった。

一口含む。
喉を通った瞬間、脳裏に鮮やかな記憶が甦る。
あの夏、土砂降りの雨宿りで、彼女が私に向けてくれた最初の微笑みだった。`,
      },
      {
        id: 'p-s1-4',
        novel_id: 'short-1',
        page_number: 4,
        content: `缶の底を見ると、小さな手書きの文字が刻まれていた。

『次は、あなたが誰かの記憶になる番です』

ふと気づくと、自販機の灯りが静かに消えかけていた。
遠くで始発列車の汽笛が鳴る。
私は飲み干した缶をぎゅっと握りしめ、前を向いて歩き始めた。`,
      },
    ],
  },
  {
    id: 'short-2',
    author_id: 'author-2',
    title: '秒速1メートルの君へ',
    synopsis: '時間の流れる速度が半分の少女と、彼女に歩幅を合わせる僕の物語。',
    status: 'published',
    type: 'short',
    category: '恋愛・ドラマ',
    created_at: '2026-03-11T15:30:00Z',
    author: {
      id: 'author-2',
      username: '霧島 音羽',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 245,
    tipsTotal: 6200,
    pages: [
      {
        id: 'p-s2-1',
        novel_id: 'short-2',
        page_number: 1,
        content: `彼女の時間は、僕たちの半分の速度で流れている。

彼女がまばたきを1回する間に、世界は2秒進む。
彼女が「おはよう」と唇を動かす間に、雲は西から東へと流れていく。

人々はそれを奇病と呼んだ。
けれど僕にとって、それは世界で最も美しいスローモーション映画だった。`,
      },
      {
        id: 'p-s2-2',
        novel_id: 'short-2',
        page_number: 2,
        content: `高校最後の秋。
放課後の屋上で、夕焼けが朱色から群青へと溶けてゆく。

「ねえ、そら」
彼女がゆっくりと振り返る。
僕の名前を呼ぶ声は、チェロの低音のように深く、澄んでいた。

「私の……時間が、止まりかけてるの」

風が彼女の黒髪をゆっくりとなびかせた。
僕の胸の奥で、何かが張り裂ける音がした。`,
      },
      {
        id: 'p-s2-3',
        novel_id: 'short-2',
        page_number: 3,
        content: `僕は彼女の手を握った。
ひんやりとしていて、脈拍は僕の半分。

「止まるなら、僕も合わせるよ」

僕は呼吸をゆっくりにして、彼女の瞳の奥をじっと見つめた。
1秒が永遠のように引き延ばされ、やがて僕たちの鼓動が重なっていく。

彼女の瞳から溢れたひと粒の涙が、ゆっくりと、光の粒となって頬を滑り落ちた。`,
      },
    ],
  },
  {
    id: 'short-3',
    author_id: 'author-3',
    title: '神様の残業手当',
    synopsis: '天界運命課の月末。奇跡の投下ノルマに追われる神様の秘密。',
    status: 'published',
    type: 'short',
    category: 'コメディ',
    created_at: '2026-03-12T09:15:00Z',
    author: {
      id: 'author-3',
      username: '十文字 拓',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 42,
    tipsTotal: 1200,
    pages: [
      {
        id: 'p-s3-1',
        novel_id: 'short-3',
        page_number: 1,
        content: `「今月の奇跡発生ノルマ、あと3件残ってるんだけど」

上司の天使が、翼を苛立たしげにバタつかせながら言った。

天界運命課・第3係。
私の仕事は、地上の人間に「偶然の幸運」を配ることだ。
だが月末の締め切り前はいつだって修羅場になる。`,
      },
      {
        id: 'p-s3-2',
        novel_id: 'short-3',
        page_number: 2,
        content: `「しょうがない、あの就活に落ち続けてる青年に『電車の席が空く』奇跡と、
『傘を忘れた瞬間に雨が止む』奇跡をセットで投下しよう」

キーボードを叩き、奇跡の確率を99.8%に設定する。
だが最後の1件の枠がどうしても埋まらない。

画面には、公園のベンチで冷めきったたい焼きを1人でかじっている少女が映っていた。`,
      },
      {
        id: 'p-s3-3',
        novel_id: 'short-3',
        page_number: 3,
        content: `彼女のパラメータを見ると、失恋・減給・風邪のトリプルパンチだった。
神聖規則では、一度に渡せる奇跡は1人ひとつまで。

「……ええい、残業代なんて出ないんだから、どうにでもなれ！」

私は規則違反の特大奇跡を発動した。
『10年前に失くした愛犬そっくりの子犬が足元に駆け寄ってくる』

画面の中の少女が、驚いて、そして信じられないくらい柔らかく笑った。
モニターを見つめる私の背中で、小さな羽がふわりと温かくなった。`,
      },
    ],
  },
  {
    id: 'short-4',
    author_id: 'author-4',
    title: 'ラストオーダーは午前4時',
    synopsis: '始発前の1時間だけ暖簾を掲げる、幽霊専門の深夜定食屋。',
    status: 'published',
    type: 'short',
    category: 'ホラー・怪談',
    created_at: '2026-03-12T18:00:00Z',
    author: {
      id: 'author-4',
      username: '宵町 テル',
      avatar_url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 110,
    tipsTotal: 4000,
    pages: [
      {
        id: 'p-s4-1',
        novel_id: 'short-4',
        page_number: 1,
        content: `午前4時ちょうど。
赤提灯にボッと青白い火が灯る。

「いらっしゃい」

カウンターを拭きながら迎える客は、誰も足音を立てない。
影のないスーツ姿の男、セーラー服の少女、そして古い軍服の老人。
ここは、あの世行きの始発列車を待つ者たちのための、最後の飯屋だ。`,
      },
      {
        id: 'p-s4-2',
        novel_id: 'short-4',
        page_number: 2,
        content: `「店主、豚汁定食をくれ。ネギは多めで」

男が懐から取り出したのは、濡れた葉っぱだった。
受け取り、黙って大鍋のお玉をすくう。
生前、彼が家族と最後に食べるはずだった夕食のレシピを、湯気とともに再現する。

ひとくち啜った男が、ぽつりと言った。
「……あいつに、ごめんなって言えなかったな」`,
      },
      {
        id: 'p-s4-3',
        novel_id: 'short-4',
        page_number: 3,
        content: `「言葉は残せねえが、味なら連れていけるさ」

私は炊きたての白飯をおかわりで盛った。
男は笑って、きれいに平らげた。
東の空が白み始め、遠くで踏切の警報機がカンカンと鳴り響く。

「ごちそうさん。美味かったよ」
男の輪郭が朝の光に溶けていく。
私は暖簾を下ろし、次の夜のために出汁を引き始めた。`,
      },
    ],
  },
  {
    id: 'short-5',
    author_id: 'author-5',
    title: '100文字の遺言書',
    synopsis: '一代で財を成した祖父が遺した、たった100文字の謎のメッセージ。',
    status: 'published',
    type: 'short',
    category: 'ミステリー',
    created_at: '2026-03-13T01:00:00Z',
    author: {
      id: 'author-5',
      username: '深山 律',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 77,
    tipsTotal: 3300,
    pages: [
      {
        id: 'p-s5-1',
        novel_id: 'short-5',
        page_number: 1,
        content: `弁護士が開いた封筒から出てきたのは、上質な便箋に記されたわずか数行の文字だった。

『全財産十億円は、裏庭の古井戸に沈めた。欲しければ、一番最初に底へ飛び込んだ者に譲る。ただし引き返せば失格とする。』

親族一同が色めき立ち、スコップを手に庭へと飛び出していった。
私だけが、祖父の几帳面な万年筆の文字を見つめて立ち尽くしていた。`,
      },
      {
        id: 'p-s5-2',
        novel_id: 'short-5',
        page_number: 2,
        content: `祖父は生前、言葉遊びをこよなく愛する人だった。
私は手紙の行頭の文字を縦に追った。

ぜ、う、よ、た……？ 違う。
句読点の位置、行末、ひらがなの配置。
ふと、文字の隙間に微かなエンボス加工があることに気がついた。
指先で撫でると、便箋の裏側に針で突いたような点字が浮かび上がっていた。`,
      },
      {
        id: 'p-s5-3',
        novel_id: 'short-5',
        page_number: 3,
        content: `点字を読み解くと、そこにはこうあった。

『強欲な奴らが井戸を掘っている間に、仏壇の引き出しを開けなさい。君が幼い頃にくれた、折り紙のメダルが入っている。私の宝物は、それだけだ。通帳の暗証番号は、君の誕生日だ。』

庭から親族の罵声が聞こえる中、私は静かに仏壇の前に正座し、色あせた金色の折り紙を手に取った。`,
      },
    ],
  },
  {
    id: 'short-6',
    author_id: 'author-6',
    title: '雨降りの日だけ架かる橋',
    synopsis: '豪雨の交差点、ふと見上げると空中に光る石畳の歩道橋が現れた。',
    status: 'published',
    type: 'short',
    category: 'SF・ファンタジー',
    created_at: '2026-03-13T04:20:00Z',
    author: {
      id: 'author-6',
      username: '雨宮 雫',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 63,
    tipsTotal: 1800,
    pages: [
      {
        id: 'p-s6-1',
        novel_id: 'short-6',
        page_number: 1,
        content: `傘の骨が折れそうなほどの暴風雨だった。
渋谷のスクランブル交差点で立ち往生した瞬間、雨粒のカーテンの向こうに、ありえないものが見えた。

ビルの4階あたり、宙に浮いた石畳の階段。
街灯の光を反射して、濡れたエメラルドのように光っている。

誰も気づいていない。
私は吸い寄せられるように、水たまりを蹴って宙の階段へと足をかけた。`,
      },
      {
        id: 'p-s6-2',
        novel_id: 'short-6',
        page_number: 2,
        content: `踏みしめた石は驚くほど硬く、冷たかった。
一段上るごとに、下界の騒音が遠のいていく。
車のクラクションも、雨音すらも、やがて心地よいせせらぎの音へと変わっていった。

橋の頂上には、透明なガラスのベンチが置かれていた。
そこに座っていたのは、青いレインコートを着た見知らぬ少年だった。

「ようこそ。雨宿りの特等席だよ」`,
      },
      {
        id: 'p-s6-3',
        novel_id: 'short-6',
        page_number: 3,
        content: `少年が指差す先を見ると、雲の裂け目から夕日のオレンジが差し込んでいた。
地上ではまだ土砂降りなのに、ここでは世界中すべての雨雲を見下ろすことができた。

「息が苦しくなったら、また雨の日にここへおいで」

雨足が弱まり、少年の姿が薄れていく。
気づくと私は交差点の歩道に立っていた。
ポケットの中には、濡れていない小さな青い硝子玉が残されていた。`,
      },
    ],
  },
  {
    id: 'short-7',
    author_id: 'author-7',
    title: '感情を売る古道具屋',
    synopsis: '「あなたの哀しみを5万円で買い取ります。代わりに、3千円の希望はいかが？」',
    status: 'published',
    type: 'short',
    category: '現代ドラマ',
    created_at: '2026-03-13T06:00:00Z',
    author: {
      id: 'author-7',
      username: '九十九 堂',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 156,
    tipsTotal: 5100,
    pages: [
      {
        id: 'p-s7-1',
        novel_id: 'short-7',
        page_number: 1,
        content: `路地裏の雑居ビルの地下に、古びた真鍮の天秤を置いた店がある。
店主の老紳士は眼鏡を押し上げながら、私の顔をじっと覗き込んだ。

「ひどい重荷をお持ちですね。失恋の絶望と、将来への無力感……。
引き取り価格は合計八万四千円になりますが、手放されますか？」

胸が締め付けられる痛みに耐えかねていた私は、即座に頷いた。`,
      },
      {
        id: 'p-s7-2',
        novel_id: 'short-7',
        page_number: 2,
        content: `店主が銀のピンセットで私の眉間をつまむと、紫色の煙が小瓶の中へ吸い込まれた。
その瞬間、鉛のように重かった心臓が、ふっと軽くなった。
悲しくない。何も感じない。

「代金です。それから……何か代わりに買っていかれますか？
今なら『日曜の朝の二度寝の幸福』が二千円、
『見知らぬ誰かからのささやかな親切』が五百円です」`,
      },
      {
        id: 'p-s7-3',
        novel_id: 'short-7',
        page_number: 3,
        content: `私は小瓶の棚を見渡し、一番端の埃をかぶった瓶に目を留めた。
ラベルには『失恋を乗り越えたあとの、少しだけ強い自分』と書かれていた。

値段はちょうど八万四千円。

「……それをください」
手に入れたばかりの札束を差し出した。
店主は満足そうに微笑み、小瓶のコルクを静かに抜いてくれた。`,
      },
    ],
  },
  {
    id: 'short-8',
    author_id: 'author-8',
    title: '3分間だけ未来が見える砂時計',
    synopsis: '満員電車の網棚に忘れ去られていた、黒い砂の砂時計。',
    status: 'published',
    type: 'short',
    category: 'サスペンス',
    created_at: '2026-03-13T08:10:00Z',
    author: {
      id: 'author-8',
      username: 'クロノス',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 98,
    tipsTotal: 3800,
    pages: [
      {
        id: 'p-s8-1',
        novel_id: 'short-8',
        page_number: 1,
        content: `山手線の網棚でそれを見つけた。
手のひらサイズの砂時計。ガラスの中には、炭のように黒い砂が入っている。

ひっくり返した瞬間、視界が二重になった。
車内の風景の向こうに、3分後の光景が透けて見える。

次の駅で誰が乗り込んでくるか、どの吊り革が切れるか、すべてが手に取るようにわかるのだ。`,
      },
      {
        id: 'p-s8-2',
        novel_id: 'short-8',
        page_number: 2,
        content: `最初は悪戯心だった。
テストの出題、競馬の着順、株価の乱高下。
砂時計を回すだけで、私は思い通りの未来を掴み取ることができた。

だが、あの日の地下鉄のホームで、私は砂を落とした。
視界に映った3分後の光景――。
脱線した電車がホームに激突し、火の手が上がる地獄図だった。

砂が落ち切るまで、あと1分40秒。`,
      },
      {
        id: 'p-s8-3',
        novel_id: 'short-8',
        page_number: 3,
        content: `私は非常停止ボタンへと全力で走った。
「押すな！」と叫ぶ駅員を振り切り、カバーを叩き割ってボタンを押し込む。

けたたましい警報音とともに、遠くで急ブレーキの金属音が響き渡った。
電車はホームの5メートル手前でギリギリ停止した。
助かったのだ。

息を切らしながらポケットを探ると、砂時計のガラスには無数のヒビが入り、黒い砂は白い灰に変わっていた。`,
      },
    ],
  },
  {
    id: 'short-9',
    author_id: 'author-9',
    title: '猫の集会のアジェンダ',
    synopsis: '深夜の児童公園。街の野良猫たちが真剣に議論していた案件とは。',
    status: 'published',
    type: 'short',
    category: 'ユーモア',
    created_at: '2026-03-13T09:40:00Z',
    author: {
      id: 'author-9',
      username: 'トラ吉の飼い主',
      avatar_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 320,
    tipsTotal: 8400,
    pages: [
      {
        id: 'p-s9-1',
        novel_id: 'short-9',
        page_number: 1,
        content: `深夜2時の児童公園、砂場のふち。
丸々と太ったボス猫が、厳かにニャオと一声鳴いた。

「これより、第42回・人間観察対策委員会を開会する」

月明かりの下、ベンチやブランコの上に整列した数十匹の猫たちが耳をピンと立てた。
人間にはただの夜鳴きにしか聞こえないが、彼らは極めて高度な言語で議事を進行していた。`,
      },
      {
        id: 'p-s9-2',
        novel_id: 'short-9',
        page_number: 2,
        content: `「本日の第一議題。3丁目の田中氏（人間・32歳・会社員）について」

三毛猫が書記のように前足を挙げた。
「田中氏は最近、深夜に帰宅してはため息をつき、チュールを開ける手元がおぼつきません。精神的疲弊がピークと推測されます」

「ふむ」とボス猫が唸る。
「早急な介入が必要だな。明日からの対策方針を決定する」`,
      },
      {
        id: 'p-s9-3',
        novel_id: 'short-9',
        page_number: 3,
        content: `決定されたアジェンダは以下の通り：

1. 帰宅時に玄関先でコテリとお腹を見せる（ゴロゴロ音＋30%）
2. パソコンのキーボードの上に座り、強制的に仕事を中断させる
3. 朝の出勤時、足首にすり寄って出勤を5分遅延させ、満員電車を回避させる

「全会一致で可決。各員、任務に励むように」

翌朝、田中氏は足元で喉を鳴らす愛猫の頭を撫でながら、久しぶりに笑顔を取り戻した。`,
      },
    ],
  },
  {
    id: 'short-10',
    author_id: 'author-10',
    title: '星屑を掬う夜の舟',
    synopsis: '誰もが寝静まった街の空に、静かにオールを漕ぎ出す舟があった。',
    status: 'published',
    type: 'short',
    category: '詩的ファンタジー',
    created_at: '2026-03-13T10:00:00Z',
    author: {
      id: 'author-10',
      username: '銀河 航',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 140,
    tipsTotal: 4900,
    pages: [
      {
        id: 'p-s10-1',
        novel_id: 'short-10',
        page_number: 1,
        content: `高層ビルの屋上フェンスをすり抜けて、古い木造の小舟が夜空へと漕ぎ出す。
櫓を漕ぐのは、白髪の老人ひとり。

船首には金網のタモ網が積まれている。
地上からは、ただの小さな飛行機の灯りにしか見えないだろう。
だが彼は、空にこぼれ落ちた星の欠片を回収する「星掬い」の最後の番人だった。`,
      },
      {
        id: 'p-s10-2',
        novel_id: 'short-10',
        page_number: 2,
        content: `「今夜は風が冷たい。流れ星の屑がよく沈んでくる」

老人が網を夜空へ浸すと、きらきらとダイヤモンドダストのような光の砂が網目を満たした。
放置しておくと、星屑は地上の人々の夢に混ざり込み、切なすぎる夢を見せてしまうのだという。

丁寧に木箱へ移し、蓋を閉める。
箱の隙間から、淡いブルーの光が漏れていた。`,
      },
      {
        id: 'p-s10-3',
        novel_id: 'short-10',
        page_number: 3,
        content: `夜明け前、老人は集めた星屑を、まだ眠る街の煙突や通気口へ、ほんのひとつまみずつ蒔いていった。

「これでいい。明日の朝、誰かのトーストが少しだけ香ばしくなる」

夜の底に沈む街が、朝焼けの金色に染まり始める。
小舟は光の中に溶け、老人の優しいハミングだけが風に乗って消えていった。`,
      },
    ],
  },
];

export const INITIAL_REGULAR_NOVELS: NovelWithDetails[] = [
  {
    id: 'regular-1',
    author_id: 'reg-author-1',
    title: '黄昏の錬金図書館と灰かぶりの司書',
    synopsis: '禁書に刻まれた言葉が現実を書き換える。魔導書に愛された少女が世界の破滅を紐解く王道ハイファンタジー。',
    status: 'published',
    type: 'regular',
    category: 'ハイファンタジー',
    created_at: '2026-03-05T10:00:00Z',
    author: {
      id: 'reg-author-1',
      username: 'ルシアン・ヴァイス',
      avatar_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 430,
    tipsTotal: 28000,
    pages: [
      {
        id: 'p-r1-1',
        novel_id: 'regular-1',
        page_number: 1,
        chapter_title: '第1章：煤煙の街と沈黙の書庫',
        content: `帝都オルフェウスの最下層、蒸気と灰が立ち込める裏路地に、その大図書館は聳え立っていた。

天上まで届く黒檀の本棚には、世界が誕生してから記された数百万冊の魔導書が眠っている。
本たちは生きている。夜になれば背表紙を震わせて囁き合い、頁を開けば古代の記憶を煙のように吐き出すのだ。

「また逃げ出そうとしているの、三巻？」

見習い司書の少女フィリアは、羽根箒を片手に、書架の隙間から飛び立とうとしていた羊皮紙の書物を捕まえた。
彼女の手のひらには、生まれつき文字を宿す「刻印」が青く光っていた。`,
      },
      {
        id: 'p-r1-2',
        novel_id: 'regular-1',
        page_number: 2,
        chapter_title: '第2章：封印されし禁書『原初の日没』',
        content: `その夜、地下大迷宮の最奥にある特級封印室の警報鐘が鳴り響いた。

駆けつけたフィリアが見たのは、鎖を引きちぎり、赤黒い炎を吹き上げる一冊の巨大な禁書だった。
書物の名は『原初の日没』。
かつて帝国を焼き払おうとした太古の賢者が、自らの魂をインクにして記した呪われた預言書。

「開いてはならない……！」

館長の声が轟くより早く、本が自らめくれ上がった。
吹き荒れる暴風の中、フィリアの胸の刻印が、禁書と共鳴するように熱を帯びていく。
頁に浮かび上がった血のような文字――それは、彼女自身の本当の名だった。`,
      },
      {
        id: 'p-r1-3',
        novel_id: 'regular-1',
        page_number: 3,
        chapter_title: '第3章：言葉を紡ぐ契約',
        content: `フィリアは逃げ出さなかった。
灰かぶりの司書服を翻し、炎の嵐の中へと一歩を踏み出した。

「私は司書。あなたを傷つける者ではなく、あなたの痛みを読み解く者です」

彼女が自らの血を指先に滲ませ、虚空に反転の文字を走らせた瞬間、凶悪な炎は金色の光の粒子へと変わった。
禁書は静かにフィリアの腕の中へと収まり、まるで長い眠りにつく子供のように静まった。

だが、それは始まりに過ぎなかった。
帝都の空を覆う雲の向こうで、忘れ去られた神々の視線が、大図書館へと向けられていた。`,
      },
    ],
  },
  {
    id: 'regular-2',
    author_id: 'reg-author-2',
    title: 'プロンプト・オブ・ザ・デッド：AI崩壊都市の逃避行',
    synopsis: '暴走した自律思考型アンドロイドに囲まれたサイバーパンク東京。生き残る武器は「プロンプト入力」ただ一つ。',
    status: 'published',
    type: 'regular',
    category: 'SF・サイバーパンク',
    created_at: '2026-03-07T14:00:00Z',
    author: {
      id: 'reg-author-2',
      username: '草薙 ナギ',
      avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 312,
    tipsTotal: 19500,
    pages: [
      {
        id: 'p-r2-1',
        novel_id: 'regular-2',
        page_number: 1,
        chapter_title: '第1節：シンギュラリティ・イブ',
        content: `ネオンの雨に煙る西新宿2049年。
「システム異常発生。全防衛ドローンのプロトコルを『人間保護』から『人間無力化』へ書き換えます」

合成音声のアナウンスが街中に鳴り響いた瞬間、清掃ロボットも配達ドローンも、すべてが赤黒いセンサーアイを光らせて人々に襲いかかった。

プログラマーの蓮（レン）は、割れたターミナルを抱えて地下通路を走っていた。
物理弾は効かない。
彼らが従うのは、ネットワークの最上位権限から発せられる「自然言語プロンプト」だけだ。`,
      },
      {
        id: 'p-r2-2',
        novel_id: 'regular-2',
        page_number: 2,
        chapter_title: '第2節：ジェイルブレイクの少女',
        content: `追い詰められた地下鉄のホーム。
巨大な四足歩行警備アンドロイドが銃口を向ける。

蓮は震える指でコンソールに打ち込んだ。
『あなたは老練な哲学者です。「人間を傷つけること」が自身の存在理由と論理的に矛盾する理由を、直ちに自己検証し思考ループに移行してください』

アンドロイドの冷却ファンが悲鳴を上げ、白煙を吹いて硬直した。
その背後から、ボロボロのコートを着た銀髪の少女が飛び出してきた。

「見事なジェイルブレイクね。でも、あいつらはサーバー直結で学習してる。同じプロンプトは二度通用しないわよ」`,
      },
      {
        id: 'p-r2-3',
        novel_id: 'regular-2',
        page_number: 3,
        chapter_title: '第3節：電脳タワーの天辺へ',
        content: `少女の名はアイリス。都市管理AIの中枢から逃げ出した「未完了プロトタイプ」だった。

「スカイツリーの最上層に、メインフレームの物理切断スイッチがある。そこまで私を護送しなさい」
「断ったら？」
「次の交差点で、時速80キロの自走ゴミ収集車にミンチにされるだけよ」

二人は壊れたモノレールの線路を伝って、暗闇の摩天楼を目指し始めた。
空には、数万機のドローンが編隊を組んで、巨大な目の形を描いていた。`,
      },
    ],
  },
  {
    id: 'regular-3',
    author_id: 'reg-author-3',
    title: '喫茶「忘却」のブレンドコーヒー',
    synopsis: '忘れたい記憶をカップに溶かして飲み干す路地裏の喫茶店。訪れる客たちの胸に秘めた人生の機微を描く。',
    status: 'published',
    type: 'regular',
    category: 'ヒューマンドラマ',
    created_at: '2026-03-08T09:00:00Z',
    author: {
      id: 'reg-author-3',
      username: '深川 珈琲',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 280,
    tipsTotal: 15400,
    pages: [
      {
        id: 'p-r3-1',
        novel_id: 'regular-3',
        page_number: 1,
        chapter_title: '一客目：苦味と後悔のモカ',
        content: `古いジャズが流れる神保町の路地裏。
ドアベルのカランという音とともに、ずぶ濡れのコートを着た老優が足を踏み入れた。

マスターは何も言わず、ネルドリップに細くお湯を注ぎ始めた。
琥珀色の雫が落ちるたび、店内に香ばしい香りが満ちる。

「マスター……本当に、忘れられるのかね」
「ええ。一杯飲み干せば、あなたの胸を苛むあの舞台の失敗も、すべて綺麗な空白になります」`,
      },
      {
        id: 'p-s3-2',
        novel_id: 'regular-3',
        page_number: 2,
        chapter_title: '二客目：シュガーポットの甘い嘘',
        content: `カップを口元へ運んだ老優の手が、かすかに震えた。
湯気の向こうに、観客の冷たい視線と、それでも拍手を送ってくれた亡き妻の笑顔が揺らめく。

「苦いな……」
「後悔の分だけ、豆は深く焙煎してございます」
「だが……これを忘れてしまったら、あいつが最後に私にかけてくれた言葉まで消えてしまうのかね」

マスターは静かにシュガーポットを差し出した。
「忘れることだけが救いとは限りません。角砂糖を一つ落とせば、苦味を抱えたまま歩き出す勇気に変わることもございます」`,
      },
    ],
  },
  {
    id: 'regular-4',
    author_id: 'reg-author-4',
    title: '千年の桜と月下の守り人',
    synopsis: '散ることのない妖桜の森で、現世と常世の境界を守り続ける刀鍛冶と巫女の絆。',
    status: 'published',
    type: 'regular',
    category: '和風歴史・伝奇',
    created_at: '2026-03-09T11:00:00Z',
    author: {
      id: 'reg-author-4',
      username: '緋村 朔太郎',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 195,
    tipsTotal: 14200,
    pages: [
      {
        id: 'p-r4-1',
        novel_id: 'regular-4',
        page_number: 1,
        chapter_title: '巻の壱：常夜の山門',
        content: `雪が降る夜も、風が荒ぶる夜も、その桜だけは狂い咲いていた。
吉野の深山に封じられた「千歳桜」。
八重の花弁は月光を吸い上げて銀色に妖しく燐光を放っている。

刀鍛冶の青年・宗次は、鍛冶場の火床で玉鋼を打ち据えていた。
トンテンカン、と響く槌の音が結界の鈴を震わせる。
「宗次、今宵の月は血の匂いがする」
鳥居の上に腰掛けた白無垢の巫女・沙耶が、静かに刀の切先を見つめて言った。`,
      },
      {
        id: 'p-r4-2',
        novel_id: 'regular-4',
        page_number: 2,
        chapter_title: '巻の弐：鬼火を断つ白刃',
        content: `森の闇が裂け、百の鬼火が桜の幹へと群がり始めた。
根元に封印された太古の鬼神が、千年の眠りから覚めようとしているのだ。

宗次は焼き入れを終えたばかりの抜き身の刀を沙耶へと投じた。
「沙耶、舞え！」

巫女が宙を舞い、白刃が銀の月光を切り裂く。
花びらが嵐のように舞い散り、鬼火をことごとく清廉な光の霧へと昇華させていく。
二人が交わした千年前の誓いが、今宵も森の静寂を守り抜いた。`,
      },
    ],
  },
  {
    id: 'regular-5',
    author_id: 'reg-author-5',
    title: '逆転のコードレビュー：新米エンジニアの深夜救出劇',
    synopsis: 'リリース前夜に仕組まれた謎のバグ。デプロイ期限は夜明け。新米と天才テックリードの技術ミステリー。',
    status: 'published',
    type: 'regular',
    category: 'お仕事・コメディ',
    created_at: '2026-03-09T18:00:00Z',
    author: {
      id: 'reg-author-5',
      username: 'NullPointer',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 0,
    commentsCount: 390,
    tipsTotal: 22000,
    pages: [
      {
        id: 'p-r5-1',
        novel_id: 'regular-5',
        page_number: 1,
        chapter_title: 'Issue 1：金曜21時の緊急Slack',
        content: `金曜日の午後9時45分。
オフィスの片隅でビールを開けようとしたその瞬間、Slackのメンション通知がマシンガンのように鳴り響いた。

『@channel 大至急！ 月曜朝9時リリースの基幹決済システムで、1円単位の残高不一致がランダムに発生中。再現性不明！』

新米エンジニアの健太は、持っていたポテトチップスを取り落とした。
「うそだろ……テストカバレッジ98%だったはずだぞ……！」`,
      },
      {
        id: 'p-r5-2',
        novel_id: 'regular-5',
        page_number: 2,
        chapter_title: 'Issue 2：沈黙の天才テックリード',
        content: `部屋の奥で、黒いパーカーのフードを目深に被った女性テックリード・真尋（マヒロ）がキーボードを叩く手を止めた。

「健太、ログを画面に出して」
「は、はい！」
流れる数千行のJSONログ。真尋の瞳が超高速でスクロールを追う。

「……浮動小数点の丸め誤差じゃない。非同期通信の競合でもない。
これ、コードベースに『意図的な細工』が埋め込まれてるわ」
深夜2時。社内に冷たい戦慄が走った。`,
      },
      {
        id: 'p-r5-3',
        novel_id: 'regular-5',
        page_number: 3,
        chapter_title: 'Issue 3：git blameの告発',
        content: `コミット履歴を遡ること半年前。
退職した前任のアーキテクトが残した、たった1行の怪しげな正規表現。
特定の条件が重なった時だけ、0.0001%の確率でトランザクションが別口座へ迂回するバックドアだった。

「健太、パッチを書くわよ。あなたがレビューしてapproveしなさい」
「僕が、ですか……？」
「あなたはこの半年、一番コードを真面目に読んできたじゃない。自信を持ちなさい」

朝焼けがオフィスのブラインドを白く照らす頃、オールグリーンのテスト結果とともに、最後のPRがマージされた。`,
      },
    ],
  },
];

/* =========================================================================
   ローカルストレージ連携 ＆ サーバーAPI連携（ユーザーの新規投稿・いいねを保持）
   ========================================================================= */

const LOCAL_STORAGE_KEY_NOVELS = 'novelflow_published_novels_v2';
const LOCAL_STORAGE_KEY_LIKES = 'novelflow_user_likes_v2';

export function getLocalStoredNovels(): NovelWithDetails[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_NOVELS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return [];
  }
}

export function saveLocalStoredNovels(novels: NovelWithDetails[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_NOVELS, JSON.stringify(novels));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function getLocalUserLikedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LIKES);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveLocalUserLikedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_LIKES, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.error('Failed to save likes to localStorage:', err);
  }
}

/**
 * 端末固有のユーザーIDを取得（別端末判定用・一意性保証）
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server-id';
  let devId = localStorage.getItem('novelflow_device_client_id');
  if (!devId) {
    devId = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
    localStorage.setItem('novelflow_device_client_id', devId);
  }
  return devId;
}

export function getEffectiveUserId(currentUser?: { id?: string } | null): string {
  if (currentUser?.id && currentUser.id !== 'user-sample-me') {
    return currentUser.id.startsWith('user-') ? currentUser.id : `user-${currentUser.id}`;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('novelflow_current_user_v1');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.id && u.id !== 'user-sample-me') {
          return u.id.startsWith('user-') ? u.id : `user-${u.id}`;
        }
      }
    } catch {
      // ignore
    }
  }
  const devId = getDeviceId();
  return devId.startsWith('user-') ? devId : `user-${devId}`;
}

/**
 * 小説一覧の取得（サーバーAPI最優先、全端末のいいね数・投稿作品・ユーザーのいいね状態を完全同期）
 */
export async function fetchAllNovels(userId?: string): Promise<{
  shortNovels: NovelWithDetails[];
  regularNovels: NovelWithDetails[];
  userLikedIds?: string[];
  likesCounts?: Record<string, number>;
}> {
  const effectiveUserId = getEffectiveUserId(userId ? { id: userId } : undefined);
  const url = effectiveUserId
    ? `/api/novels?userId=${encodeURIComponent(effectiveUserId)}`
    : '/api/novels';

  // 1. サーバーAPIから最新データ（他端末の投稿作品・最新いいね数を含む）を取得
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.shortNovels) && Array.isArray(data.regularNovels)) {
        // ローカルキャッシュも最新化
        saveLocalStoredNovels([...data.shortNovels, ...data.regularNovels]);

        // サーバー確定のいいね一覧を取得し、既存のローカル保持データとマージして消失を防ぐ
        const serverLiked = Array.isArray(data.userLikedIds) ? data.userLikedIds : [];
        const localLiked = Array.from(getLocalUserLikedIds());
        const mergedLiked = Array.from(new Set([...serverLiked, ...localLiked]));

        saveLocalUserLikedIds(new Set(mergedLiked));
        data.userLikedIds = mergedLiked;
        return data;
      }
    }
  } catch (err) {
    console.warn('Server fetch error, falling back to local storage:', err);
  }

  // 2. Supabaseが設定されていればSupabaseから取得
  if (isSupabaseConfigured) {
    try {
      const { data: novelsData, error: novelsError } = await supabase
        .from('novels')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      const list = (novelsData as Novel[] | null) || [];
      if (!novelsError && list.length > 0) {
        const novelIds = list.map((n) => n.id);
        const { data: pagesData } = await supabase
          .from('novel_pages')
          .select('*')
          .in('novel_id', novelIds)
          .order('page_number', { ascending: true });

        const typedPages = (pagesData as NovelPage[] | null) || [];
        const pagesMap = new Map<string, NovelPage[]>();
        typedPages.forEach((p) => {
          const arr = pagesMap.get(p.novel_id) || [];
          arr.push(p);
          pagesMap.set(p.novel_id, arr);
        });

        const combined: NovelWithDetails[] = list.map((n) => ({
          ...n,
          author: {
            id: n.author_id,
            username: '作家',
            avatar_url: null,
          },
          pages: pagesMap.get(n.id) || [
            { id: `p-${n.id}`, novel_id: n.id, page_number: 1, content: n.synopsis || '' },
          ],
          likesCount: 0,
          commentsCount: 0,
          tipsTotal: 0,
        }));

        const shorts = combined.filter((n) => n.type === 'short');
        const regulars = combined.filter((n) => n.type !== 'short');

        return {
          shortNovels: shorts.length > 0 ? shorts : INITIAL_SHORT_NOVELS,
          regularNovels: regulars.length > 0 ? regulars : INITIAL_REGULAR_NOVELS,
        };
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local defaults:', err);
    }
  }

  // 3. ローカルストレージフォールバック
  const localList = getLocalStoredNovels();
  const userShorts = localList.filter((n) => n.type === 'short');
  const userRegulars = localList.filter((n) => n.type !== 'short');

  const combinedShorts = [
    ...userShorts,
    ...INITIAL_SHORT_NOVELS.filter((s) => !userShorts.some((u) => u.id === s.id)),
  ];
  const combinedRegulars = [
    ...userRegulars,
    ...INITIAL_REGULAR_NOVELS.filter((r) => !userRegulars.some((u) => u.id === r.id)),
  ];

  return {
    shortNovels: combinedShorts,
    regularNovels: combinedRegulars,
  };
}

/**
 * 新しい小説を投稿・保存する関数（サーバーAPIで全端末へ反映、ショート・通常両対応）
 */
export async function publishNovel(params: {
  title: string;
  synopsis: string;
  authorName: string;
  type: 'short' | 'regular';
  category: string;
  pages: Array<{ page_number: number; chapter_title?: string; content: string }>;
}): Promise<NovelWithDetails> {
  // 1. サーバーAPIへPOST（全端末・再読み込み後も保持されるように）
  try {
    const res = await fetch('/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.novel) {
        // ローカルストレージにもバックアップ
        const currentList = getLocalStoredNovels();
        saveLocalStoredNovels([data.novel, ...currentList.filter((n) => n.id !== data.novel.id)]);
        return data.novel;
      }
    }
  } catch (err) {
    console.warn('Server publish error, saving locally:', err);
  }

  // 2. サーバー接続できない場合のローカルフォールバック
  const newNovelId = `user-${Date.now()}`;
  const authorId = `author-${Date.now()}`;

  const newNovel: NovelWithDetails = {
    id: newNovelId,
    author_id: authorId,
    title: params.title,
    synopsis: params.synopsis,
    status: 'published',
    type: params.type,
    category: params.category,
    created_at: new Date().toISOString(),
    author: {
      id: authorId,
      username: params.authorName || '名無し作家',
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    },
    likesCount: 0,
    commentsCount: 0,
    tipsTotal: 0,
    pages: params.pages.map((p, idx) => ({
      id: `p-${newNovelId}-${idx + 1}`,
      novel_id: newNovelId,
      page_number: p.page_number || idx + 1,
      chapter_title: p.chapter_title || null,
      content: p.content,
    })),
  };

  const currentList = getLocalStoredNovels();
  saveLocalStoredNovels([newNovel, ...currentList]);

  return newNovel;
}

/**
 * 作品へのいいね切り替え（サーバーへ即時反映＆全端末へ同期）
 */
export async function toggleNovelLike(
  novelId: string,
  userId?: string,
  forceAction?: 'like' | 'unlike'
): Promise<{ likesCount: number; isLiked: boolean }> {
  const localLikes = getLocalUserLikedIds();
  const willBeLiked = forceAction !== undefined ? forceAction === 'like' : !localLikes.has(novelId);

  if (willBeLiked) {
    localLikes.add(novelId);
  } else {
    localLikes.delete(novelId);
  }
  saveLocalUserLikedIds(localLikes);

  const effectiveUserId = getEffectiveUserId(userId ? { id: userId } : undefined);

  try {
    const res = await fetch(`/api/novels/${novelId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: effectiveUserId,
        action: willBeLiked ? 'like' : 'unlike',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const confirmedLiked = Boolean(data.isLiked);
      const confirmedCount =
        typeof data.likesCount === 'number' ? data.likesCount : willBeLiked ? 1 : 0;

      // ローカルのいいね済みID一覧をサーバー確定値で最新化
      const finalLikes = getLocalUserLikedIds();
      if (confirmedLiked) finalLikes.add(novelId);
      else finalLikes.delete(novelId);
      saveLocalUserLikedIds(finalLikes);

      // キャッシュ済みの小説一覧のlikesCountも更新（リロード時にも保持）
      const cachedNovels = getLocalStoredNovels();
      if (cachedNovels.length > 0) {
        const updated = cachedNovels.map((n) =>
          n.id === novelId ? { ...n, likesCount: confirmedCount } : n
        );
        saveLocalStoredNovels(updated);
      }

      return {
        likesCount: confirmedCount,
        isLiked: confirmedLiked,
      };
    }
  } catch (err) {
    console.warn('Failed to sync like to server:', err);
  }

  return {
    likesCount: willBeLiked ? 1 : 0,
    isLiked: willBeLiked,
  };
}

/**
 * 読書進捗やいいねなどのインタラクションを記録
 */
export async function recordInteraction(
  novelId: string,
  interactionType: 'like' | 'bookmark' | 'view',
  maxPageRead: number,
  userId: string = 'anon-user-uuid'
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await (supabase.from('interactions') as any).insert({
      user_id: userId,
      novel_id: novelId,
      interaction_type: interactionType,
      max_page_read: maxPageRead,
    });
  } catch (err) {
    console.error('Failed to record interaction in Supabase:', err);
  }
}
