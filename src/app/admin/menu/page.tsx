'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import type { Category, MenuItem } from '@/lib/types'

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showItemForm, setShowItemForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', category_id: '', available: true })
  const [categoryForm, setCategoryForm] = useState({ name: '', sort_order: 0 })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [catRes, itemsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').order('sort_order')
      ])
      if (catRes.data) setCategories(catRes.data)
      if (itemsRes.data) setMenuItems(itemsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveItem() {
    if (!itemForm.name || !itemForm.price || !itemForm.category_id) {
      alert('Please fill all required fields')
      return
    }
    try {
      const itemData = {
        name: itemForm.name,
        description: itemForm.description || null,
        price: parseFloat(itemForm.price),
        category_id: itemForm.category_id,
        available: itemForm.available
      }
      if (editingItem) {
        await supabase.from('menu_items').update(itemData).eq('id', editingItem.id)
      } else {
        await supabase.from('menu_items').insert(itemData)
      }
      setShowItemForm(false)
      setEditingItem(null)
      setItemForm({ name: '', description: '', price: '', category_id: '', available: true })
      fetchData()
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Failed to save item')
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await supabase.from('menu_items').delete().eq('id', id)
      fetchData()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  async function toggleItemAvailability(id: string, available: boolean) {
    try {
      await supabase.from('menu_items').update({ available: !available }).eq('id', id)
      fetchData()
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  async function saveCategory() {
    if (!categoryForm.name) {
      alert('Category name is required')
      return
    }
    try {
      if (editingCategory) {
        await supabase.from('categories').update({ name: categoryForm.name, sort_order: categoryForm.sort_order }).eq('id', editingCategory.id)
      } else {
        await supabase.from('categories').insert({ name: categoryForm.name, sort_order: categoryForm.sort_order || categories.length + 1 })
      }
      setShowCategoryForm(false)
      setEditingCategory(null)
      setCategoryForm({ name: '', sort_order: 0 })
      fetchData()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Are you sure? This will also delete all items in this category.')) return
    try {
      await supabase.from('categories').delete().eq('id', id)
      fetchData()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const filteredItems = selectedCategory ? menuItems.filter(item => item.category_id === selectedCategory) : menuItems

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-[#2D5A3D] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1E1E1E]">Categories</h2>
          <button onClick={() => setShowCategoryForm(true)} className="flex items-center gap-1 text-sm text-[#2D5A3D] font-medium">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <div key={category.id} className="group flex items-center gap-1 bg-gray-100 rounded-lg pl-3 pr-1 py-1">
              <button onClick={() => setSelectedCategory(category.id === selectedCategory ? '' : category.id)} className={`text-sm font-medium ${selectedCategory === category.id ? 'text-[#2D5A3D]' : 'text-gray-700'}`}>
                {category.name}
              </button>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingCategory(category); setCategoryForm({ name: category.name, sort_order: category.sort_order }); setShowCategoryForm(true) }} className="p-1 hover:bg-gray-200 rounded transition-colors">
                  <Edit2 className="w-3 h-3 text-gray-500" />
                </button>
                <button onClick={() => deleteCategory(category.id)} className="p-1 hover:bg-red-100 rounded transition-colors">
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1E1E1E]">Menu Items {selectedCategory && `(${categories.find(c => c.id === selectedCategory)?.name})`}</h2>
          <button onClick={() => { setItemForm({ name: '', description: '', price: '', category_id: selectedCategory, available: true }); setShowItemForm(true) }} className="flex items-center gap-1 text-sm text-[#2D5A3D] font-medium">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {filteredItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#1E1E1E]">{item.name}</span>
                  <button onClick={() => toggleItemAvailability(item.id, item.available)} className={`px-2 py-0.5 rounded text-xs font-medium ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.available ? 'Available' : 'Out of Stock'}
                  </button>
                </div>
                <p className="text-sm text-gray-500">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditingItem(item); setItemForm({ name: item.name, description: item.description || '', price: item.price.toString(), category_id: item.category_id, available: item.available }); setShowItemForm(true) }} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && <p className="text-center text-gray-500 py-4">No items found</p>}
        </div>
      </div>
      {showItemForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowItemForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setShowItemForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={itemForm.category_id} onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Item name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Item description" rows={2} className="resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input type="number" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} placeholder="Price" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="available" checked={itemForm.available} onChange={e => setItemForm({ ...itemForm, available: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                <label htmlFor="available" className="text-sm text-gray-700">Available</label>
              </div>
              <button onClick={saveItem} className="w-full py-3 bg-[#2D5A3D] text-white font-semibold rounded-xl hover:bg-[#3a7a52] transition-all">
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCategoryForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowCategoryForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Category name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={categoryForm.sort_order} onChange={e => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })} placeholder="Sort order" />
              </div>
              <button onClick={saveCategory} className="w-full py-3 bg-[#2D5A3D] text-white font-semibold rounded-xl hover:bg-[#3a7a52] transition-all">
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
