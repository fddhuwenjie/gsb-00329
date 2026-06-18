import { db } from '../db.js'
import type { Author } from '../types.js'

export const authorRepository = {
  findAll(): Author[] {
    return db.prepare('SELECT * FROM authors ORDER BY name').all() as Author[]
  },

  findById(id: number): Author | undefined {
    return db.prepare('SELECT * FROM authors WHERE id = ?').get(id) as Author | undefined
  },

  create(input: { name: string; avatar?: string; bio?: string }): Author {
    const stmt = db.prepare('INSERT INTO authors (name, avatar, bio) VALUES (?, ?, ?)')
    const result = stmt.run(input.name, input.avatar || null, input.bio || null)
    return this.findById(result.lastInsertRowid as number)!
  },

  update(id: number, input: { name?: string; avatar?: string; bio?: string }): Author | undefined {
    const author = this.findById(id)
    if (!author) return undefined

    const stmt = db.prepare(`
      UPDATE authors SET
        name = COALESCE(?, name),
        avatar = COALESCE(?, avatar),
        bio = COALESCE(?, bio)
      WHERE id = ?
    `)
    stmt.run(input.name || null, input.avatar || null, input.bio || null, id)
    return this.findById(id)
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM authors WHERE id = ?').run(id)
    return result.changes > 0
  }
}
