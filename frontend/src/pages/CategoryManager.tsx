import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('income');
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense'>('income');

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await api.post('/api/categories', { name: newName, type: newType });
      setCategories([...categories, res.data]);
      setNewName('');
      setNewType('income');
      toast.success('Category added');
    } catch {
      toast.error('Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      setIsLoading(true);
      await api.delete(`/api/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditType(cat.type);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId === null) return;
    try {
      setIsLoading(true);
      const res = await api.put(`/api/categories/${editId}`, { name: editName, type: editType });
      setCategories(categories.map(c => (c.id === editId ? res.data : c)));
      setEditId(null);
      toast.success('Category updated');
    } catch {
      toast.error('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manage Categories</h2>
      
      {/* Add new category form */}
      <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Category name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            className="border rounded px-3 py-2"
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as 'income' | 'expense')}
            className="border rounded px-3 py-2"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add Category
          </button>
        </div>
      </form>

      {/* Categories table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === cat.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === cat.id ? (
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value as 'income' | 'expense')}
                      className="border rounded px-2 py-1"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900">{cat.type.charAt(0).toUpperCase() + cat.type.slice(1)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === cat.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEdit}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(cat)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No categories found. Add your first category above.
          </div>
        )}
      </div>
    </div>
  );
}
