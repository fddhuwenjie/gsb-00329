import { db } from '../db.js'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types.js'

export const categoryRepository = {
  findAll(): Category[] {
    const categories = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.status = 'published') as count
      FROM categories c
      ORDER BY c.name
    `).all() as Category[]
    return categories
  },

  findById(id: number): Category | undefined {
    return db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.status = 'published') as count
      FROM categories c WHERE c.id = ?
    `).get(id) as Category | undefined
  },

  findBySlug(slug: string): Category | undefined {
    return db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.status = 'published') as count
      FROM categories c WHERE c.slug = ?
    `).get(slug) as Category | undefined
  },

  create(input: CreateCategoryInput): Category {
    const stmt = db.prepare(`
      INSERT INTO categories (name, slug, icon, color, description)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      input.name,
      input.slug,
      input.icon || '📁',
      input.color || 'border-slate-200 hover:border-slate-500 hover:bg-slate-50',
      input.description || null
    )
    return this.findById(result.lastInsertRowid as number)!
  },

  update(id: number, input: UpdateCategoryInput): Category | undefined {
    const category = this.findById(id)
    if (!category) return undefined

    const stmt = db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        description = COALESCE(?, description)
      WHERE id = ?
    `)
    stmt.run(
      input.name || null,
      input.slug || null,
      input.icon || null,
      input.color || null,
      input.description || null,
      id
    )
    return this.findById(id)
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return result.changes > 0
  }
}
