import { isHTTPError } from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { Tag } from '../../../shared/types/tag';

export default function AdminTags(): ReactElement {
  const navigate = useNavigate();
  
  const [tags, setTags] = useState<Array<Tag>>([]);
  const [hasNext, setHasNext] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const pageNumber = pageParam == null ? 1 : Number(pageParam);
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  const fetchTags = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    try {
      const response = await adminApi.get(`/api/admin/tags?page=${page}`).json<{ result: { page: number; tags: Array<Tag>; has_next: boolean; } }>();
      setTags(response.result.tags);
      setHasNext(response.result.has_next);
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(extractApiErrorMessage(error, 'タグ一覧の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    void fetchTags();
  }, [navigate, page]);
  
  const handleAdd = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if(newTagName.trim() === '') return;
    
    setError('');
    setIsSubmitting(true);
    try {
      await adminApi.post('/api/admin/tags', { json: { name: newTagName } }).json();
      setNewTagName('');
      await fetchTags();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'タグの追加に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (tag: Tag): void => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
    setError('');
  };
  
  const handleCancelEdit = (): void => {
    setEditingTagId(null);
    setEditingTagName('');
  };
  
  const handleUpdate = async (tagId: number): Promise<void> => {
    if(editingTagName.trim() === '') return;
    
    setError('');
    setIsSubmitting(true);
    try {
      await adminApi.put(`/api/admin/tags/${tagId}`, { json: { name: editingTagName } });
      setEditingTagId(null);
      setEditingTagName('');
      await fetchTags();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'タグの更新に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (tagId: number): Promise<void> => {
    setError('');
    setIsSubmitting(true);
    try {
      await adminApi.delete(`/api/admin/tags/${tagId}`);
      await fetchTags();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'タグの削除に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>タグ管理</h1>
      
      <form onSubmit={handleAdd} className="form-grid">
        <label>
          タグ名
          <input
            type="text"
            value={newTagName}
            onChange={event => setNewTagName(event.target.value)}
            disabled={isSubmitting}
          />
        </label>
        <button type="submit" disabled={isSubmitting}>追加</button>
      </form>
      
      {error !== '' && <p className="text-error">{error}</p>}
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : tags.length === 0 ? (
        <p>タグが登録されていません。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>タグ名</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map(tag => (
              <tr key={tag.id}>
                <td>{tag.id}</td>
                <td>
                  {editingTagId === tag.id ? (
                    <input
                      type="text"
                      value={editingTagName}
                      onChange={event => setEditingTagName(event.target.value)}
                      disabled={isSubmitting}
                    />
                  ) : (
                    tag.name
                  )}
                </td>
                <td>
                  {editingTagId === tag.id ? (
                    <>
                      <button type="button" onClick={() => void handleUpdate(tag.id)} disabled={isSubmitting}>保存</button>
                      <button type="button" onClick={handleCancelEdit} disabled={isSubmitting}>取消</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => handleEdit(tag)} disabled={isSubmitting}>編集</button>
                      <button type="button" onClick={() => void handleDelete(tag.id)} disabled={isSubmitting}>削除</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        {page > 1 && <Link to={{ pathname: '/admin/tags', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>}
        {hasNext && <Link to={{ pathname: '/admin/tags', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>}
      </div>
    </main>
  );
}
