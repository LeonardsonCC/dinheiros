import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

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
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-8 animate-fade-in">Manage Categories</h2>
        
        {/* Add new category form */}
        <GlassCard variant="elevated" animation="slide-up" className="mb-8">
          <form onSubmit={handleAdd} className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add New Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Category name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            className="glass-input px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as 'income' | 'expense')}
            className="glass-input px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-300"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <GlassButton 
            type="submit" 
            disabled={isLoading}
            variant="primary"
            size="md"
          >
            Add Category
          </GlassButton>
        </div>
          </form>
        </GlassCard>

        {/* Categories table */}
        <GlassCard variant="elevated" animation="slide-up" className="overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === cat.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="glass-input px-3 py-2 w-full text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === cat.id ? (
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value as 'income' | 'expense')}
                      className="glass-input px-3 py-2 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-300">{cat.type.charAt(0).toUpperCase() + cat.type.slice(1)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === cat.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEdit}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(cat)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600"
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
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No categories found. Add your first category above.
          </div>
        )}
        </GlassCard>
      </div>
    </div>
  );
}
