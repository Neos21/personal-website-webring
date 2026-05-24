import { type ReactElement } from 'react';
import { Link } from 'react-router';

import { appConstants } from '../../../shared/constants/app-constants';

export default function Index(): ReactElement {
  /* eslint-disable neos-eslint-plugin/comment-colon-spacing */
  const exampleNavigationBarHtml = `<table style="border: 1px solid #000; border-collapse: collapse;"><tbody>
  <tr>
    <td style="width: 200px; height: 40px; padding: 0; background: #fff;">
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
  
  return (
    <main>
      <title>個人サイトウェブリング</title>
      <h1>{appConstants.siteNameJapanese}</h1>
      
      <div className="my-16 text-center"><Link to="/new">新規登録</Link> | <Link to={{ pathname: '/list', search: '?page=1' }}>登録サイト一覧</Link> | <Link to="/random">ランダムジャンプ</Link> | <Link to={{ pathname: '/support', search: '?page=1' }}>サポート掲示板</Link></div>
      
      <div className="mb-16 [&>h2]:mt-8 [&>*]:mb-2 [&>h2]:font-bold">  {/* eslint-disable-line neos-eslint-plugin/comment-colon-spacing */}
        <p>「{appConstants.siteNameJapanese}」は、個人サイト同士を繋ぐウェブリングです。</p>
        <p>サイトのジャンルやコンテンツの質・量は関係ありません。個人ウェブサイトであればどんなサイトでも参加できます♪</p>
        
        <h2>参加の手順</h2>
        <p><Link to="/new">新規登録フォーム</Link>よりサイトを登録してください☆</p>
        <p>自分のサイトを登録するほか、他の方が運営しているサイトを「他薦」として登録することもできます☆</p>
        
        <h2>ナビゲーションバー</h2>
        <p>サイトのどこかにナビゲーションバーを設置していただけると、個人サイトの輪が広がります。(必須ではありません)</p>
        <p><span className="text-red-600">【ID】</span> の部分を、登録した時のあなたの ID に差し替えてください。HTML は自由に改造してもらっても結構です。</p>
        <p><textarea value={exampleNavigationBarHtml} rows={4} readOnly={true} /></p>
        <table className="w-auto border border-black">
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
      </div>
      
      <div className="text-slate-500 text-sm text-center">Copyright © 2026 <a className="text-inherit" href="https://github.com/Neos21/personal-website-webring">{appConstants.siteNameJapanese}</a>, All rights reserved.</div>
    </main>
  );
}
