import React, { useEffect, useState } from 'react';
import { categorizationRulesApi, categoriesApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';

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
  const [newType, setNewType] = useState('exact');
  const [newValue, setNewValue] = useState('');
  const [newTransactionType, setNewTransactionType] = useState('expense');
  const [newCategoryDst, setNewCategoryDst] = useState<number>(0);
  const [newActive, setNewActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('exact');
  const [editValue, setEditValue] = useState('');
  const [editTransactionType, setEditTransactionType] = useState('expense');
  const [editCategoryDst, setEditCategoryDst] = useState<number>(0);
  const [editActive, setEditActive] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<CategorizationRule | null>(null);

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
      setNewType('exact');
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

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    try {
      setIsLoading(true);
      await categorizationRulesApi.delete(ruleToDelete.id);
      setRules(rules.filter(r => r.id !== ruleToDelete.id));
      toast.success('Categorization rule deleted');
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } catch {
      toast.error('Failed to delete categorization rule');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (rule: CategorizationRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
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
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Manage Categorization Rules</h2>
      
      {/* Add new rule form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Rule</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  type="text"
                  placeholder="Rule name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ruleType">Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regex">Regex</SelectItem>
                    <SelectItem value="exact">Exact Match</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ruleValue">Match Value</Label>
                <Input
                  id="ruleValue"
                  type="text"
                  placeholder={newType === 'exact' ? 'Exact text to match' : 'Regex pattern'}
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="transactionType">Transaction Type</Label>
                <Select value={newTransactionType} onValueChange={setNewTransactionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newCategoryDst.toString()} onValueChange={(value) => setNewCategoryDst(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoriesByType(newTransactionType).map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newActive"
                  checked={newActive}
                  onCheckedChange={(checked) => setNewActive(checked === true)}
                />
                <Label htmlFor="newActive">Active</Label>
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              Add Rule
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Rules table */}
      <Card>
        <CardHeader>
          <CardTitle>Categorization Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              No categorization rules found. Add your first rule above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Match Value</TableHead>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      {editId === rule.id ? (
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <div className="font-medium">{rule.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === rule.id ? (
                        <Select value={editType} onValueChange={setEditType}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regex">Regex</SelectItem>
                            <SelectItem value="exact">Exact Match</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{rule.type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === rule.id ? (
                        <Input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder={editType === 'exact' ? 'Exact text to match' : 'Regex pattern'}
                          className="w-full"
                        />
                      ) : (
                        <div className="break-all font-mono text-sm">{rule.value}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === rule.id ? (
                        <Select value={editTransactionType} onValueChange={setEditTransactionType}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={rule.transaction_type === 'income' ? 'default' : 'secondary'}>
                          {rule.transaction_type ? rule.transaction_type.charAt(0).toUpperCase() + rule.transaction_type.slice(1) : 'All'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === rule.id ? (
                        <Select value={editCategoryDst.toString()} onValueChange={(value) => setEditCategoryDst(Number(value))}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getCategoriesByType(editTransactionType).map(category => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>{getCategoryName(rule.category_dst)}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === rule.id ? (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editActive}
                            onCheckedChange={(checked) => setEditActive(checked === true)}
                          />
                          <Label>Active</Label>
                        </div>
                      ) : (
                        <Button
                          variant={rule.active ? "default" : "secondary"}
                          size="sm"
                          onClick={() => toggleActive(rule)}
                          disabled={isLoading}
                        >
                          {rule.active ? 'Active' : 'Inactive'}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === rule.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleEdit}
                            disabled={isLoading}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditId(null)}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(rule)}
                            disabled={isLoading}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(rule)}
                            disabled={isLoading}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Categorization Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule &ldquo;{ruleToDelete?.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 