import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { Category } from '../types';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Tag } from 'lucide-react';

type CategoryFormData = Omit<Category, 'id' | 'isActive'>;

const Categories: React.FC = () => {
  const { categories, transactions, addCategory, updateCategory, deleteCategory, isFinanceLoading, financeError } = useFinance();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initialFormState: CategoryFormData = { name: '', type: 'expense', icon: '❓', color: '#808080' };
  const [formData, setFormData] = useState<CategoryFormData>(initialFormState);

  const colors = ['#3B82F6', '#10B981', '#EF4444', '#7C3AED', '#F97316', '#0891B2', '#EC4899', '#84CC16'];

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    transactions.forEach(transaction => {
        if (!transaction.category) return;
        const currentTotal = totals.get(String(transaction.category)) || 0;
        // Se for despesa, consideramos o valor. Se for receita, também.
        // O tipo de categoria (despesa/receita) já filtra o que é exibido.
        totals.set(String(transaction.category), currentTotal + transaction.amount);
    });
    return totals;
  }, [transactions]);

  useEffect(() => {
    if (showModal) {
      if (editingCategory) {
        setFormData({ name: editingCategory.name, type: editingCategory.type, icon: editingCategory.icon, color: editingCategory.color });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [showModal, editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.icon.trim()) {
        setFormError('Nome e ícone são obrigatórios.');
        return;
    };
    
    setIsSubmitting(true);
    setFormError(null);
    
    const success = editingCategory 
      ? await updateCategory(editingCategory.id, formData)
      : await addCategory(formData);

    setIsSubmitting(false);
    if (success) {
      resetForm();
    } else {
      setFormError("Não foi possível salvar a categoria. Tente novamente.");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja apagar esta categoria?')) {
        await deleteCategory(id);
    }
  }

  const resetForm = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormError(null);
  };

  if (isFinanceLoading) return <div className="flex justify-center items-center h-full p-8"><Loader2 className="w-16 h-16 animate-spin text-primary-600" /></div>;
  if (financeError) return <div className="p-4 bg-red-100 text-red-700 rounded-md">Ocorreu um erro: {financeError}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias</h1>
          <p className="text-gray-600 dark:text-gray-400">Organize suas receitas e despesas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18}/> Nova Categoria</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => {
            const total = categoryTotals.get(String(category.id)) || 0;
            return (
                <div key={category.id} className="card p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{backgroundColor: category.color}}>
                                {category.icon}
                            </div>
                            <div>
                                <p className="font-bold text-lg text-gray-800 dark:text-white">{category.name}</p>
                                <p className={`text-sm font-medium ${category.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {category.type === 'income' ? 'Receita' : 'Despesa'}
                                </p>
                            </div>
                        </div>
                        <div className="flex">
                            <button onClick={() => handleEdit(category)} className="p-2 text-gray-400 hover:text-primary-600"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(category.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                        </div>
                    </div>
                    <div className="text-right mt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total na Categoria</p>
                        <p className={`text-2xl font-bold ${category.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            );
        })}
        {categories.length === 0 && (
            <div className="col-span-full text-center py-12 card">
                <Tag size={48} className="mx-auto text-gray-400"/>
                <h3 className="mt-2 text-lg font-medium dark:text-white">Nenhuma categoria encontrada</h3>
                <p className="text-gray-600 dark:text-gray-400">Comece adicionando a sua primeira categoria.</p>
            </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              {formError && (<div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center gap-2"><AlertCircle size={16}/><span>{formError}</span></div>)}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Categoria *</label>
                <input type="text" placeholder="Ex: Lazer, Salário..." value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} className="input-field" required disabled={isSubmitting} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ícone (emoji) *</label>
                <input type="text" placeholder="Ex: 🍔, 💰..." value={formData.icon} onChange={e => setFormData(f => ({...f, icon: e.target.value}))} maxLength={2} className="input-field" required disabled={isSubmitting} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                <select value={formData.type} onChange={e => setFormData(f => ({...f, type: e.target.value as any}))} className="input-field" disabled={isSubmitting}>
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map(color => (
                      <button key={color} type="button" onClick={() => setFormData(f => ({...f, color }))} disabled={isSubmitting} className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-primary-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1" disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 flex justify-center items-center gap-2" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingCategory ? 'Salvar' : 'Criar Categoria')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;