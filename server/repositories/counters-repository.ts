import type { Counter } from '../../shared/types/counter';

export class CountersRepository {
  constructor(private readonly db: D1Database) { }
  
  public async find(): Promise<Counter | null> {
    return await this.db
      .prepare('SELECT counter FROM counters LIMIT 1')
      .first<Counter>();
  }
  
  public async update(): Promise<void> {
    await this.db
      .prepare('UPDATE counters SET counter = counter + 1')
      .run();
  }
}
