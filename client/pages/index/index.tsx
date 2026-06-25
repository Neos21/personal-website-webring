import ky from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import { appConstants } from '../../../shared/constants/app-constants';

export default function Index(): ReactElement {
  /* eslint-disable neos-eslint-plugin/comment-colon-spacing */
  const exampleNavigationBarHtml = `<table style="border: 1px solid #000; border-collapse: collapse;"><tbody>
  <tr>
    <td style="padding: 0; background: #fff;">
      <a href="${appConstants.origin}" target="_blank"><img src="${appConstants.origin}/banner-200x40.png" width="200" height="40" alt="${appConstants.siteNameJapanese}"></a>
    </td>
  </tr>
  <tr>
    <td style="padding: 0; text-align: center; background: #fff;">
      [<a href="${appConstants.origin}/prev?id=【ID】" target="_blank">Prev</a>
      |<a href="${appConstants.origin}/random?id=【ID】" target="_blank">Random</a>
      |<a href="${appConstants.origin}/list" target="_blank">List</a>
      |<a href="${appConstants.origin}/next?id=【ID】" target="_blank">Next</a>]
    </td>
  </tr>
</tbody></table>`;
  /* eslint-enable */
  
  const [counter, setCounter] = useState<number | null>(null);
  
  useEffect(() => {
    (async () => {
      try {
        const response = await ky.get('/api/counters').json<{ result: number; }>();
        setCounter(response.result);
      }
      catch(error) {
        console.error('Get Counters Error', error);
        setCounter(0);
      }
    })();
  }, []);
  
  return (
    <main>
      <title>個人サイトウェブリング</title>
      <h1>{appConstants.siteNameJapanese}</h1>
      
      <div className="mt-16 mb-12 text-center"><Link to="/new">新規登録</Link> | <Link to={{ pathname: '/list', search: '?page=1' }}>登録サイト一覧</Link> | <Link to="/random">ランダムジャンプ</Link> | <Link to={{ pathname: '/support', search: '?page=1' }}>サポート掲示板</Link></div>
      
      {counter != null && (
        <div className="mb-12 text-center [&>img]:inline">  {/* eslint-disable-line neos-eslint-plugin/comment-colon-spacing */}
          <span className="mr-2">あなたは</span>
          {String(counter).split('').map(number => (
            <img src={`/${number}.png`} width={22} height={32} alt="" />
          ))}
          <span className="ml-2">番目のお客さまです♪</span>
        </div>
      )}
      
      <div className="mb-16 [&>*]:mb-2 [&>h2]:mt-8 [&>h2]:font-bold">  {/* eslint-disable-line neos-eslint-plugin/comment-colon-spacing */}
        <p>「{appConstants.siteNameJapanese}」は、個人サイト同士を繋ぐウェブリングです。</p>
        <p>サイトのジャンルやコンテンツの質・量は関係ありません。個人ウェブサイトであればどんなサイトでも参加できます♪</p>
        <p className="text-muted">レンタルブログのようなテンプレート選択型のサイトや、他者との交流を主目的とした汎用 SNS プラットフォームは登録対象外です。サイトデザインや構造に、管理人自身の表現・工夫が見られるサイトを歓迎しています。</p>
        
        <h2>参加の手順</h2>
        <p><Link to="/new">新規登録フォーム</Link>よりサイトを登録してください☆</p>
        <p>自分のサイトを登録するほか、他の方が運営しているサイトを「他薦」として登録することもできます☆</p>
        
        <h2>ナビゲーションバー</h2>
        <p>サイトのどこかにナビゲーションバーを設置していただけると、個人サイトの輪が広がります。(必須ではありません)</p>
        <p><span className="text-red-600">【ID】</span> の部分を、登録した時のあなたの ID に差し替えてください。HTML は自由に改造してもらっても結構です。</p>
        <p><textarea value={exampleNavigationBarHtml} rows={4} readOnly={true} /></p>
        <table className="w-auto mx-auto border border-black">
          <tbody>
            <tr>
              <td className="p-0 bg-white">
                <Link to="/"><img src="/banner-200x40.png" width="200" height="40" alt={appConstants.siteNameJapanese} /></Link>
              </td>
            </tr>
            <tr>
              <td className="p-0 text-center bg-white">
                [<Link to={{ pathname: '/prev', search: '?id=1' }}>Prev</Link>
                |<Link to={{ pathname: '/random', search: '?id=1' }}>Random</Link>
                |<Link to="/list">List</Link>
                |<Link to={{ pathname: '/next', search: '?id=1' }}>Next</Link>]
              </td>
            </tr>
          </tbody>
        </table>
        
        <h2>おことわり</h2>
        <p>不正な URL や閉鎖されたサイトは、発見次第削除させていただきます。</p>
        <p>本ウェブリングに関するお問い合わせは<Link to={{ pathname: '/support', search: '?page=1' }}>サポート掲示板</Link>までご連絡ください。</p>
        
        <h2>個人サイトを探す</h2>
        <p>本ウェブリング以外に個人サイトを収集しているサイトを紹介します。</p>
        <ul className="pl-6 list-disc">
          <li><a href="https://mingeiinter.net/" target="_blank">ミンゲイインターネット</a></li>
          <li><a href="https://mingeiinter.net/motto/" target="_blank">ミンゲイインターネット - モット</a></li>
          <li><a href="https://kobliy.vercel.app/" target="_blank">こぶりー</a></li>
          <li><a href="https://s.10prs.com/" target="_blank">ハコサチ</a></li>
          <li><a href="https://compslink.jp/" target="_blank">コンパスリンク</a></li>
          <li><a href="https://gebecy.github.io/web10unite/" target="_blank">Web1.0 同盟</a></li>
          <li><a href="https://ietsuku.i-ra.site/" target="_blank">いえつく</a></li>
          <li><a href="http://kn1.x0.to/" target="_blank">よろずりんく</a></li>
        </ul>
      </div>
      
      <div className="mb-2"><img className="mx-auto" src="/banner-88x31.png" width="88" height="31" alt={appConstants.siteNameJapanese} /></div>
      <div className="text-muted text-sm text-center">Copyright © 2026 <a className="text-inherit" href="https://github.com/Neos21/personal-website-webring">{appConstants.siteNameJapanese}</a>, All rights reserved.</div>
    </main>
  );
}
