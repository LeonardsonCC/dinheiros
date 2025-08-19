import React, { useEffect, useState } from 'react';
import { categorizationRulesApi, categoriesApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      toast.error(t('categorizationRules.messages.fetchCategoriesFailed'));
    }
  };

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const res = await categorizationRulesApi.list();
      setRules(res.data);
    } catch (err) {
      toast.error(t('categorizationRules.messages.fetchRulesFailed'));
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
      toast.error(t('categorizationRules.messages.noCategoriesForType'));
      return;
    }
    if (newCategoryDst === 0) {
      toast.error(t('categorizationRules.messages.selectCategoryRequired'));
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
      toast.success(t('categorizationRules.messages.ruleAdded'));
    } catch {
      toast.error(t('categorizationRules.messages.addRuleFailed'));
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
      toast.success(t('categorizationRules.messages.ruleDeleted'));
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } catch {
      toast.error(t('categorizationRules.messages.deleteRuleFailed'));
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
      toast.error(t('categorizationRules.messages.noCategoriesForType'));
      return;
    }
    if (editId === null) return;
    if (editCategoryDst === 0) {
      toast.error(t('categorizationRules.messages.selectCategoryRequired'));
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
      toast.success(t('categorizationRules.messages.ruleUpdated'));
    } catch {
      toast.error(t('categorizationRules.messages.updateRuleFailed'));
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
      toast.success(rule.active ? t('categorizationRules.messages.ruleDeactivated') : t('categorizationRules.messages.ruleActivated'));
    } catch {
      toast.error(t('categorizationRules.messages.updateStatusFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : t('categorizationRules.unknownCategory', { categoryId });
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">{t('categorizationRules.title')}</h2>
      
      {/* Add new rule form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('categorizationRules.addNewRule')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ruleName">{t('categorizationRules.ruleName')}</Label>
                <Input
                  id="ruleName"
                  type="text"
                  placeholder={t('categorizationRules.ruleNamePlaceholder')}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ruleType">{t('categorizationRules.type')}</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regex">{t('categorizationRules.ruleTypes.regex')}</SelectItem>
                    <SelectItem value="exact">{t('categorizationRules.ruleTypes.exact')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ruleValue">{t('categorizationRules.matchValue')}</Label>
                <Input
                  id="ruleValue"
                  type="text"
                  placeholder={newType === 'exact' ? t('categorizationRules.exactMatchPlaceholder') : t('categorizationRules.regexPlaceholder')}
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="transactionType">{t('categorizationRules.transactionType')}</Label>
                <Select value={newTransactionType} onValueChange={setNewTransactionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t('categorizationRules.transactionTypes.expense')}</SelectItem>
                    <SelectItem value="income">{t('categorizationRules.transactionTypes.income')}</SelectItem>
                    <SelectItem value="transfer">{t('categorizationRules.transactionTypes.transfer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">{t('categorizationRules.category')}</Label>
                <Select value={newCategoryDst.toString()} onValueChange={(value) => setNewCategoryDst(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('categorizationRules.selectCategory')} />
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
                <Label htmlFor="newActive">{t('categorizationRules.active')}</Label>
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {t('categorizationRules.addRule')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Rules table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('categorizationRules.categorizationRules')}</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('categorizationRules.noRulesFound')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('categorizationRules.name')}</TableHead>
                  <TableHead>{t('categorizationRules.type')}</TableHead>
                  <TableHead>{t('categorizationRules.matchValue')}</TableHead>
                  <TableHead>{t('categorizationRules.transactionType')}</TableHead>
                  <TableHead>{t('categorizationRules.category')}</TableHead>
                  <TableHead>{t('categorizationRules.status')}</TableHead>
                  <TableHead>{t('categorizationRules.actions')}</TableHead>
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
                            <SelectItem value="regex">{t('categorizationRules.ruleTypes.regex')}</SelectItem>
                            <SelectItem value="exact">{t('categorizationRules.ruleTypes.exact')}</SelectItem>
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
                          placeholder={editType === 'exact' ? t('categorizationRules.exactMatchPlaceholder') : t('categorizationRules.regexPlaceholder')}
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
                            <SelectItem value="expense">{t('categorizationRules.transactionTypes.expense')}</SelectItem>
                            <SelectItem value="income">{t('categorizationRules.transactionTypes.income')}</SelectItem>
                            <SelectItem value="transfer">{t('categorizationRules.transactionTypes.transfer')}</SelectItem>
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
                          <Label>{t('categorizationRules.active')}</Label>
                        </div>
                      ) : (
                        <Button
                          variant={rule.active ? "default" : "secondary"}
                          size="sm"
                          onClick={() => toggleActive(rule)}
                          disabled={isLoading}
                          >
                            {rule.active ? t('categorizationRules.statusLabels.active') : t('categorizationRules.statusLabels.inactive')}
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
                            {t('categorizationRules.save')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditId(null)}
                            disabled={isLoading}
                          >
                            {t('categorizationRules.cancel')}
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
                            {t('categorizationRules.edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(rule)}
                            disabled={isLoading}
                          >
                            {t('categorizationRules.delete')}
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
            <DialogTitle>{t('categorizationRules.deleteRule')}</DialogTitle>
            <DialogDescription>
              {t('categorizationRules.confirmDelete', { ruleName: ruleToDelete?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('categorizationRules.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {t('categorizationRules.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 