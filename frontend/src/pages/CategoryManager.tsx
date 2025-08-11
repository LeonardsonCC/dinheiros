import React, { useEffect, useState } from 'react';
import api from '../services/api';
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
import { Textarea } from '../components/ui/textarea';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';
import { Loading } from '../components/ui/loading';

interface Category {
  id: number;
  name: string;
  description?: string;
  type: 'income' | 'expense' | 'transfer';
}

export default function CategoryManager() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      toast.error(t('categoryManager.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error(t('categoryManager.nameRequired'));
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.post('/api/categories', {
        name: newName.trim(),
        description: newDescription.trim(),
        type: newType
      });
      setCategories([...categories, res.data]);
      setNewName('');
      setNewDescription('');
      setNewType('expense');
      toast.success(t('categoryManager.added'));
    } catch {
      toast.error(t('categoryManager.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsLoading(true);
      await api.delete(`/api/categories/${categoryToDelete.id}`);
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      toast.success('Category deleted successfully');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
    setEditType(cat.type);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId === null) return;
    if (!editName.trim()) {
      toast.error(t('categoryManager.nameRequired'));
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.put(`/api/categories/${editId}`, {
        name: editName.trim(),
        description: editDescription.trim(),
        type: editType
      });
      setCategories(categories.map(c => (c.id === editId ? res.data : c)));
      setEditId(null);
      toast.success('Category updated successfully');
    } catch {
      toast.error('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <TagIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">{t('categoryManager.categories')}</h1>
      </div>

      {/* Add new category form */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            {t('categoryManager.addNew')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">{t('categoryManager.name')} *</Label>
                <Input
                  id="categoryName"
                  type="text"
                  placeholder={t('categoryManager.namePlaceholder')}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryType">{t('categoryManager.type')} *</Label>
                <Select value={newType} onValueChange={(value) => setNewType(value as 'income' | 'expense' | 'transfer')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t('dashboard.expenses')}</SelectItem>
                    <SelectItem value="income">{t('dashboard.income')}</SelectItem>
                    <SelectItem value="transfer">{t('categoryManager.transfer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">{t('categoryManager.description')}</Label>
              <Textarea
                id="categoryDescription"
                placeholder={t('categoryManager.descriptionPlaceholder')}
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              {isLoading ? t('categoryManager.adding') : t('categoryManager.addCategory')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            {t('categoryManager.categories')} ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No categories found</p>
              <p className="text-sm text-muted-foreground">Add your first category above to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead className="w-[30%]">Description</TableHead>
                    <TableHead className="w-[15%]">Type</TableHead>
                    <TableHead className="w-[15%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(cat => (
                    <TableRow key={cat.id} className="hover:bg-muted/50">
                      <TableCell>
                        {editId === cat.id ? (
                          <Input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full"
                            placeholder={t('categoryManager.namePlaceholder')}
                          />
                        ) : (
                          <div className="font-medium">{cat.name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editId === cat.id ? (
                          <Textarea
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            className="w-full min-h-[60px]"
                            placeholder={t('categoryManager.descriptionPlaceholder')}
                            rows={2}
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {cat.description || 'No description'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editId === cat.id ? (
                          <Select value={editType} onValueChange={(value) => setEditType(value as 'income' | 'expense' | 'transfer')}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">{t('dashboard.expenses')}</SelectItem>
                              <SelectItem value="income">{t('dashboard.income')}</SelectItem>
                              <SelectItem value="transfer">{t('categoryManager.transfer')}</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant={
                              cat.type === 'income' ? 'default' :
                                cat.type === 'expense' ? 'secondary' :
                                  'outline'
                            }
                            className="capitalize"
                          >
                            {cat.type === 'income' ? t('dashboard.income') :
                              cat.type === 'expense' ? t('dashboard.expenses') :
                                t('categoryManager.transfer')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editId === cat.id ? (
                          <div className="flex gap-1 justify-end">
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
                              {t('categoryManager.cancel')}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(cat)}
                              disabled={isLoading}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDeleteDialog(cat)}
                              disabled={isLoading}
                              className="text-destructive hover:text-destructive"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrashIcon className="h-5 w-5 text-destructive" />
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to delete the category <strong>&ldquo;{categoryToDelete?.name}&rdquo;</strong>?
              This action cannot be undone and may affect existing transactions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isLoading}>
              {t('categoryManager.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
