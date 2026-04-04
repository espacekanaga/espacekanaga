import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/Loading';
import { useToast } from '../../hooks/useToast';
import { pricingApi, type PricingItem } from '../../api/pricing';

export function PricingManagementPage() {
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PricingItem>>({ category: 'pressing', price: 0 });
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    loadPricing();
  }, []);

  async function loadPricing() {
    try {
      const data = await pricingApi.get();
      // Convert from response format to PricingItem array
      const items: PricingItem[] = [
        ...data.pressing.map(([name, priceStr]) => ({
          serviceName: name,
          price: parseInt(priceStr.replace(/[^0-9]/g, '')),
          category: 'pressing' as const
        })),
        ...data.atelier.map(([name, priceStr]) => ({
          serviceName: name,
          price: parseInt(priceStr.replace(/[^0-9]/g, '')),
          category: 'atelier' as const
        }))
      ];
      setPricing(items);
    } catch (error) {
      showError('Erreur lors du chargement des tarifs');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddItem() {
    if (!newItem.serviceName || !newItem.price) {
      showError('Veuillez remplir tous les champs');
      return;
    }

    setIsSaving(true);
    try {
      await pricingApi.updateItem(newItem as PricingItem);
      showSuccess('Tarif ajoute avec succes');
      setNewItem({ category: 'pressing', price: 0, serviceName: '' });
      await loadPricing();
    } catch (error) {
      showError('Erreur lors de l\'ajout du tarif');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem(serviceName: string, category: 'pressing' | 'atelier') {
    if (!confirm(`Supprimer le tarif "${serviceName}" ?`)) return;

    setIsSaving(true);
    try {
      await pricingApi.deleteItem(serviceName, category);
      showSuccess('Tarif supprime avec succes');
      await loadPricing();
    } catch (error) {
      showError('Erreur lors de la suppression');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdatePrice(serviceName: string, category: 'pressing' | 'atelier', newPrice: number) {
    setIsSaving(true);
    try {
      await pricingApi.updateItem({ serviceName, price: newPrice, category });
      showSuccess('Tarif mis a jour');
      await loadPricing();
    } catch (error) {
      showError('Erreur lors de la mise a jour');
    } finally {
      setIsSaving(false);
    }
  }

  const pressingItems = pricing.filter(p => p.category === 'pressing');
  const atelierItems = pricing.filter(p => p.category === 'atelier');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Gestion des Tarifs
        </h1>
      </div>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un nouveau tarif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Service
              </label>
              <input
                type="text"
                placeholder="Ex: Chemise"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newItem.serviceName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, serviceName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prix (FCFA)
              </label>
              <input
                type="number"
                placeholder="2500"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newItem.price || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categorie
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                value={newItem.category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, category: e.target.value as 'pressing' | 'atelier' })}
              >
                <option value="pressing">Pressing</option>
                <option value="atelier">Atelier</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddItem} 
                isLoading={isSaving}
                className="w-full"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pressing Prices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Tarifs Pressing
            <Badge variant="info">{pressingItems.length} services</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pressingItems.map((item) => (
              <div key={item.serviceName} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.serviceName}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newPrice = parseInt(e.target.value) || 0;
                      setPricing(pricing.map(p => 
                        p.serviceName === item.serviceName && p.category === item.category
                          ? { ...p, price: newPrice }
                          : p
                      ));
                    }}
                    onBlur={() => handleUpdatePrice(item.serviceName, item.category, item.price)}
                    className="w-28 px-2 py-1 text-right border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-slate-500">FCFA</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.serviceName, item.category)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
            {pressingItems.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Aucun tarif de pressing defini
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Atelier Prices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            Tarifs Atelier
            <Badge variant="info">{atelierItems.length} services</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {atelierItems.map((item) => (
              <div key={item.serviceName} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.serviceName}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newPrice = parseInt(e.target.value) || 0;
                      setPricing(pricing.map(p => 
                        p.serviceName === item.serviceName && p.category === item.category
                          ? { ...p, price: newPrice }
                          : p
                      ));
                    }}
                    onBlur={() => handleUpdatePrice(item.serviceName, item.category, item.price)}
                    className="w-28 px-2 py-1 text-right border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-slate-500">FCFA</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.serviceName, item.category)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
            {atelierItems.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Aucun tarif d&apos;atelier defini
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
