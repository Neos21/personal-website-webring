import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminNewOrUpdateTagSchema } from '../../../shared/schemas/admin/admin-tag-schema';
import { tagDisplayName, tagMaxLength } from '../../../shared/schemas/site-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { Tag } from '../../../shared/types/tag';

export default function AdminTags(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ページング
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  // 一覧
  const [tags   , setTags   ] = useState<Array<Tag>>([]);
  const [hasNext, setHasNext] = useState<boolean>(false);
  
  // 登録フォーム
  const [newTagName, setNewTagName] = useState<string>('');
  
  // 編集フォーム
  const [editingTagId  , setEditingTagId  ] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState<string>('');
  
  // エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    setIsLoading(true);
    setError('');
    setNewTagName('');
    setEditingTagId(null);
    setEditingTagName('');
    
    // URL に `page=1` がなければ再読込する
    const currentPageNumber = Number(pageParam);
    const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
    if(needsPageFix) {
      navigate('/admin/tags?page=1', { replace: true });
      return;
    }
    
    (async () => {
      try {
        const response = await adminApi.get(`/api/admin/tags?page=${page}`).json<{ result: { page: number; tags: Array<Tag>; has_next: boolean; }; }>();
        setTags(response.result.tags);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, 'タグ一覧の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [location.key, pageParam, page]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    const payload = {
      name: newTagName
    };
    const parsed = adminNewOrUpdateTagSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    try {
      await adminApi.post('/api/admin/tags', { json: parsed.data }).json();
      navigate('/admin/tags?page=1');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'タグの追加に失敗しました'));
    }
  };
  
  const onStartEdit = (tag: Tag): void => {
    setError('');
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  };
  
  const onCancelEdit = (): void => {
    setError('');
    setEditingTagId(null);
    setEditingTagName('');
  };
  
  const onEdit = async (id: number): Promise<void> => {
    setError('');
    
    const payload = {
      name: editingTagName
    };
    const parsed = adminNewOrUpdateTagSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    try {
      await adminApi.put(`/api/admin/tags/${id}`, { json: parsed.data });
      onCancelEdit();
      navigate(`/admin/tags?page=${page}`);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'タグの編集に失敗しました'));
    }
  };
  
  const onDelete = async (id: number): Promise<void> => {
    setError('');
    
    try {
      await adminApi.delete(`/api/admin/tags/${id}`);
      navigate('/admin/tags?page=1');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'タグの削除に失敗しました'));
    }
  };
  
  return (
    <main>
      <title>タグ管理 - 個人サイトウェブリング</title>
      <h1>タグ管理</h1>
      
      <form className="mb-8 flex gap-x-3" onSubmit={onSubmit}>
        <input className="flex-1" type="text" placeholder={tagDisplayName} value={newTagName} maxLength={tagMaxLength} onChange={event => setNewTagName(event.target.value)} required />
        <button className="flex-none" type="submit">追加</button>
      </form>
      
      {!isEmpty(error) && (<div className="mb-8 p-4 font-bold text-red-600 bg-red-50">{error}</div>)}
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : tags.length === 0 ? (
        <>
          <div className="mb-8 text-slate-500 text-sm">タグはありません。</div>
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/admin/tags', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/tags', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      ) : (
        <>
          <table className="mb-8">
            <thead>
              <tr>
                <th>ID</th>
                <th>タグ名</th>
                <th>編集・削除</th>
              </tr>
            </thead>
            <tbody>
              {tags.map(tag => (
                <tr key={tag.id}>
                  <td className="text-right whitespace-nowrap">{tag.id}</td>
                  <td className="w-full">
                    {editingTagId === tag.id ? (
                      <input type="text" placeholder={tagDisplayName} value={editingTagName} onChange={event => setEditingTagName(event.target.value)} required />
                    ) : (
                      tag.name
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {editingTagId === tag.id ? (
                      <>
                        <button type="button" onClick={() => onEdit(tag.id)}>保存</button>
                        <button className="ml-2" type="button" onClick={onCancelEdit}>取消</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => onStartEdit(tag)}>編集</button>
                        <span className="form-danger ml-2"><button type="button" onClick={() => onDelete(tag.id)}>削除</button></span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/admin/tags', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/tags', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      )}
      
      <div className="text-right"><Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
