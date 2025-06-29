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
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manage Categories</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          required
          className="border rounded px-2 py-1"
        />
        <select
          value={newType}
          onChange={e => setNewType(e.target.value as 'income' | 'expense')}
          className="border rounded px-2 py-1"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button type="submit" disabled={isLoading} className="bg-primary-600 text-white px-4 py-1 rounded">
          Add
        </button>
      </form>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id} className="border-t">
              <td className="px-4 py-2">
                {editId === cat.id ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                ) : (
                  cat.name
                )}
              </td>
              <td className="px-4 py-2">
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
                  cat.type.charAt(0).toUpperCase() + cat.type.slice(1)
                )}
              </td>
              <td className="px-4 py-2 flex gap-2">
                {editId === cat.id ? (
                  <>
                    <button onClick={handleEdit} className="text-green-600">Save</button>
                    <button onClick={() => setEditId(null)} className="text-gray-500">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(cat)} className="text-blue-600">Edit</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-600">Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
