'use client';

import React, { useEffect, useState } from 'react';
import { orderService } from '@/services/apiService';
import { BackendOrder } from '@/types';
import { MapPin, Phone, Package, CheckCircle, XCircle, RefreshCw, Loader, AlertCircle, Eye } from 'lucide-react';

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  assignée: { label: 'Assignée', color: '#06B6D4', bgColor: '#CFFAFE', icon: <Package size={16} /> },
  en_cours: { label: 'En Cours', color: '#F59E0B', bgColor: '#FEF3C7', icon: <Package size={16} /> },
  livré: { label: 'Livré', color: '#10B981', bgColor: '#DCFCE7', icon: <CheckCircle size={16} /> },
  échoué: { label: 'Échoué', color: '#EF4444', bgColor: '#FEE2E2', icon: <XCircle size={16} /> },
};

export default function LivreurOrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.statut_livraison === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter]);

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await orderService.getAssignedOrders();
      const data = Array.isArray(response) ? response : response.results || [];
      setOrders(data);
    } catch (err: any) {
      console.error('Failed to fetch assigned orders:', err);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDeliveryStatus = async (numeroCommande: string, action: 'livrer' | 'echouer') => {
    setIsUpdating(true);
    try {
      let motif = '';
      if (action === 'echouer') {
        motif = prompt('Veuillez indiquer la raison de l\'échec:') || '';
        if (!motif) {
          setIsUpdating(false);
          return;
        }
      }

      await orderService.updateDeliveryAction(numeroCommande, {
        action,
        motif,
      });

      alert(action === 'livrer' ? 'Commande marquée comme livrée' : 'Commande marquée comme échouée');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      console.error('Failed to update delivery:', err);
      alert('Failed to update delivery status: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusStyle = (status: string) => {
    return DELIVERY_STATUS_CONFIG[status] || DELIVERY_STATUS_CONFIG.assignée;
  };

  const formatPrice = (price: number | string) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mes Livraisons</h1>
        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'assignée', 'en_cours', 'livré', 'échoué'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'all'
              ? 'Tous'
              : DELIVERY_STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Aucune livraison assignée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusStyle = getStatusStyle(order.statut_livraison || 'assignée');
            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">Commande #{order.numero_commande}</h3>
                      <div
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: statusStyle.bgColor, color: statusStyle.color }}
                      >
                        {statusStyle.icon}
                        {statusStyle.label}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Client: {order.client_name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(order.montant_total)}</p>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 space-y-2">
                  {order.adresse_livraison && (
                    <div className="flex gap-2">
                      <MapPin size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{order.adresse_livraison}</p>
                    </div>
                  )}
                  {order.client_phone && (
                    <div className="flex gap-2">
                      <Phone size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{order.client_phone}</p>
                    </div>
                  )}
                  {order.date_livraison_estimee && (
                    <p className="text-sm text-gray-700">
                      📅 Date estimée: {formatDate(order.date_livraison_estimee)}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Eye size={18} />
                    Détails
                  </button>

                  {order.statut_livraison !== 'livré' && order.statut_livraison !== 'échoué' && (
                    <>
                      <button
                        onClick={() => handleUpdateDeliveryStatus(order.numero_commande, 'livrer')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle size={18} />
                        Livré
                      </button>
                      <button
                        onClick={() => handleUpdateDeliveryStatus(order.numero_commande, 'echouer')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle size={18} />
                        Échoué
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Commande #{selectedOrder.numero_commande}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Statut de la Livraison</h3>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium"
                  style={{
                    backgroundColor: getStatusStyle(selectedOrder.statut_livraison || 'assignée').bgColor,
                    color: getStatusStyle(selectedOrder.statut_livraison || 'assignée').color,
                  }}
                >
                  {getStatusStyle(selectedOrder.statut_livraison || 'assignée').icon}
                  {getStatusStyle(selectedOrder.statut_livraison || 'assignée').label}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Informations Client</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="text-gray-600">Nom:</span> <span className="font-medium">{selectedOrder.client_name || '-'}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Téléphone:</span> <span className="font-medium">{selectedOrder.client_phone || '-'}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Email:</span> <span className="font-medium">{selectedOrder.client_email || '-'}</span>
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.adresse_livraison && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Adresse de Livraison</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-900">{selectedOrder.adresse_livraison}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Articles</h3>
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  {selectedOrder.ligne_commandes?.map((ligne, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{ligne.nom_produit || 'Produit'}</p>
                        <p className="text-sm text-gray-600">Quantité: {ligne.quantite}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatPrice(ligne.prix_unitaire)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Montant Total</p>
                <p className="text-3xl font-bold text-gray-900">{formatPrice(selectedOrder.montant_total)}</p>
              </div>

              {/* Action Buttons */}
              {selectedOrder.statut_livraison !== 'livré' && selectedOrder.statut_livraison !== 'échoué' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleUpdateDeliveryStatus(selectedOrder.numero_commande, 'livrer');
                    }}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Mise à jour...' : 'Marquer comme Livré'}
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateDeliveryStatus(selectedOrder.numero_commande, 'echouer');
                    }}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Mise à jour...' : 'Marquer comme Échoué'}
                  </button>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
