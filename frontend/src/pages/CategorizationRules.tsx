import React, { useEffect, useState } from 'react';
import { categorizationRulesApi, categoriesApi } from '../services/api';
import { toast } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  type: string;
}

interface CategorizationRule {
  id: number;
  name: string;
  type: string;
  value: string;
  transaction_type?: string;
  category_dst: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CategorizationRules() {
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('regex');
  const [newValue, setNewValue] = useState('');
  const [newTransactionType, setNewTransactionType] = useState('expense');
  const [newCategoryDst, setNewCategoryDst] = useState<number>(0);
  const [newActive, setNewActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('regex');
  const [editValue, setEditValue] = useState('');
  const [editTransactionType, setEditTransactionType] = useState('expense');
  const [editCategoryDst, setEditCategoryDst] = useState<number>(0);
  const [editActive, setEditActive] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.list();
      setCategories(res.data);
      if (res.data.length > 0 && newCategoryDst === 0) {
        setNewCategoryDst(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      toast.error('Failed to fetch categories');
    }
  };

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const res = await categorizationRulesApi.list();
      setRules(res.data);
    } catch (err) {
      toast.error('Failed to fetch categorization rules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchRules();
  }, []);

  // Helper to get categories by type
  const getCategoriesByType = (type: string) => categories.filter(c => c.type === type);

  // When transaction type changes, update category selection
  useEffect(() => {
    const filtered = getCategoriesByType(newTransactionType);
    setNewCategoryDst(filtered.length > 0 ? filtered[0].id : 0);
  }, [newTransactionType, categories]);

  useEffect(() => {
    if (editId !== null) {
      const filtered = getCategoriesByType(editTransactionType);
      setEditCategoryDst(filtered.length > 0 ? filtered[0].id : 0);
    }
  }, [editTransactionType, categories, editId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (getCategoriesByType(newTransactionType).length === 0) {
      toast.error('No categories available for this transaction type');
      return;
    }
    if (newCategoryDst === 0) {
      toast.error('Please select a category');
      return;
    }
    try {
      setIsLoading(true);
      const res = await categorizationRulesApi.create({
        name: newName,
        type: newType,
        value: newValue,
        transaction_type: newTransactionType,
        category_dst: newCategoryDst,
        active: newActive,
      });
      setRules([...rules, res.data]);
      setNewName('');
      setNewType('regex');
      setNewValue('');
      setNewTransactionType('expense');
      setNewCategoryDst(categories.length > 0 ? categories[0].id : 0);
      setNewActive(true);
      toast.success('Categorization rule added');
    } catch {
      toast.error('Failed to add categorization rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this categorization rule?')) return;
    try {
      setIsLoading(true);
      await categorizationRulesApi.delete(id);
      setRules(rules.filter(r => r.id !== id));
      toast.success('Categorization rule deleted');
    } catch {
      toast.error('Failed to delete categorization rule');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (rule: CategorizationRule) => {
    setEditId(rule.id);
    setEditName(rule.name);
    setEditType(rule.type);
    setEditValue(rule.value);
    setEditTransactionType(rule.transaction_type || 'expense');
    setEditCategoryDst(rule.category_dst);
    setEditActive(rule.active);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (getCategoriesByType(editTransactionType).length === 0) {
      toast.error('No categories available for this transaction type');
      return;
    }
    if (editId === null) return;
    if (editCategoryDst === 0) {
      toast.error('Please select a category');
      return;
    }
    try {
      setIsLoading(true);
      const res = await categorizationRulesApi.update(editId, {
        name: editName,
        type: editType,
        value: editValue,
        transaction_type: editTransactionType,
        category_dst: editCategoryDst,
        active: editActive,
      });
      setRules(rules.map(r => (r.id === editId ? res.data : r)));
      setEditId(null);
      toast.success('Categorization rule updated');
    } catch {
      toast.error('Failed to update categorization rule');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (rule: CategorizationRule) => {
    try {
      setIsLoading(true);
      const res = await categorizationRulesApi.update(rule.id, {
        active: !rule.active,
      });
      setRules(rules.map(r => (r.id === rule.id ? res.data : r)));
      toast.success(`Rule ${rule.active ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update rule status');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : `Unknown Category (${categoryId})`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manage Categorization Rules</h2>
      
      {/* Add new rule form */}
      <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New Rule</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Rule name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            className="border rounded px-3 py-2"
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="regex">Regex</option>
          </select>
          <input
            type="text"
            placeholder="Pattern value"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            required
            className="border rounded px-3 py-2"
          />
          <select
            value={newTransactionType}
            onChange={e => setNewTransactionType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
          <select
            value={newCategoryDst}
            onChange={e => setNewCategoryDst(Number(e.target.value))}
            required
            className="border rounded px-3 py-2"
          >
            <option value={0}>Select category...</option>
            {getCategoriesByType(newTransactionType).map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newActive"
              checked={newActive}
              onChange={e => setNewActive(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="newActive">Active</label>
          </div>
        </div>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add Rule
        </button>
      </form>

      {/* Rules table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules.map(rule => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === rule.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === rule.id ? (
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="regex">Regex</option>
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900">{rule.type}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editId === rule.id ? (
                    <input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 break-all">{rule.value}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === rule.id ? (
                    <select
                      value={editTransactionType}
                      onChange={e => setEditTransactionType(e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900">{rule.transaction_type ? rule.transaction_type.charAt(0).toUpperCase() + rule.transaction_type.slice(1) : 'All'}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === rule.id ? (
                    <select
                      value={editCategoryDst}
                      onChange={e => setEditCategoryDst(Number(e.target.value))}
                      className="border rounded px-2 py-1"
                    >
                      {getCategoriesByType(editTransactionType).map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900">{getCategoryName(rule.category_dst)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === rule.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={e => setEditActive(e.target.checked)}
                        className="rounded"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleActive(rule)}
                      disabled={isLoading}
                      className={`px-2 py-1 text-xs rounded-full ${
                        rule.active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {rule.active ? 'Active' : 'Inactive'}
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editId === rule.id ? (
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
                        onClick={() => startEdit(rule)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
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
        {rules.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No categorization rules found. Add your first rule above.
          </div>
        )}
      </div>
    </div>
  );
} 