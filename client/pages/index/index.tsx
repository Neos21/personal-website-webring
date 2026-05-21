import ky from 'ky';
import { useEffect, useState, type ReactElement } from 'react';

export default function Index(): ReactElement {
  const [todo, setTodo] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      try {
        const todoResult = await ky.get('/api/sites').json<{ result: string; }>();
        console.log('TODO Result', todoResult);
        setTodo(todoResult.result ?? 'NULL');
      }
      catch(error) {
        console.error('TODO Error', error);
        setTodo('ERROR');
      }
    })();
  }, []);
  
  return (
    <main className="index-page">
      <h1>個人サイトウェブリング</h1>
      <p>{todo}</p>
    </main>
  );
}
