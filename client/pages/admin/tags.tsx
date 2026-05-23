import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { tagDisplayName, tagMaxLength } from '../../../shared/schemas/site-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { Tag } from '../../../shared/types/tag';

export default function AdminTags(): ReactElement {
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
  }, [pageParam, page]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    if(isEmpty(newTagName)) return;
    
    try {
      await adminApi.post('/api/admin/tags', { json: { name: newTagName } }).json();
      navigate('/api/admin/tags?page=1');
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
    
    if(isEmpty(editingTagName)) return;
    
    try {
      await adminApi.put(`/api/admin/tags/${id}`, { json: { name: editingTagName } });
      onCancelEdit();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'タグの編集に失敗しました'));
    }
  };
  
  const onDelete = async (id: number): Promise<void> => {
    setError('');
    
    try {
      await adminApi.delete(`/api/admin/tags/${id}`);
      navigate('/api/admin/tags?page=1');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'タグの削除に失敗しました'));
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>タグ</h1>
      
      <form onSubmit={onSubmit}>
        <label>
          <div className="form-label">{tagDisplayName}</div>
          <input type="text" placeholder={tagDisplayName} value={newTagName} maxLength={tagMaxLength} onChange={event => setNewTagName(event.target.value)} required />
        </label>
        <p><button type="submit">追加</button></p>
      </form>
      
      {!isEmpty(error) && (<p className="text-error">{error}</p>)}
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : tags.length === 0 ? (
        <p>タグはありません。</p>
      ) : (
        <table>
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
                <td className="nowrap">{tag.id}</td>
                <td>
                  {editingTagId === tag.id ? (
                    <input type="text" placeholder={tagDisplayName} value={editingTagName} onChange={event => setEditingTagName(event.target.value)} required />
                  ) : (
                    tag.name
                  )}
                </td>
                <td>
                  {editingTagId === tag.id ? (
                    <>
                      <button type="button" onClick={() => onEdit(tag.id)}>保存</button>
                      <button type="button" onClick={onCancelEdit}>取消</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => onStartEdit(tag)}>編集</button>
                      <span className="form-delete"><button type="button" onClick={() => onDelete(tag.id)}>削除</button></span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {(page > 1 || hasNext) && (
        <p className="text-center">
          {page > 1            && (<Link to={{ pathname: '/admin/tags', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
          {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
          {hasNext             && (<Link to={{ pathname: '/admin/tags', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
        </p>
      )}
    </main>
  );
}
