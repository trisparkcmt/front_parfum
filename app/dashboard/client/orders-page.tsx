'use client';

import React, { useEffect, useState } from 'react';
import { orderService } from '@/services/apiService';
import { BackendOrder } from '@/types';
import { AlertCircle, Clock, CheckCircle, Truck, Package, X, Loader } from 'lucide-react';

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await orderService.getOrders();
      setOrders(response.results || response);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderDetails = async (numeroCommande: string) => {
    try {
      const details = await orderService.pollOrderStatus(numeroCommande);
      setSelectedOrder(details);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      alert('Failed to load order details');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: { bg: string; text: string; icon: React.ReactNode } } = {
      en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={16} /> },
      validé: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <CheckCircle size={16} /> },
      annulée: { bg: 'bg-red-100', text: 'text-red-800', icon: <X size={16} /> },
      remboursée: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Package size={16} /> },
    };

    const style = styles[status] || styles.en_attente;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
        {style.icon}
        <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
      </div>
    );
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'assignée':
        return <Truck className="text-blue-600" size={24} />;
      case 'livrée':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'échouée':
        return <AlertCircle className="text-red-600" size={24} />;
      default:
        return <Clock className="text-gray-600" size={24} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg">
        <h1 className="text-4xl font-bold mb-2">My Orders</h1>
        <p className="text-blue-100">Track and manage your orders</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">No orders yet</p>
          <p className="text-gray-500">Start shopping to place your first order</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => fetchOrderDetails(order.numero_commande)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">{getDeliveryStatusIcon(order.statut_livraison)}</div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Order {order.numero_commande}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.date_creation).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(order.statut)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-semibold text-gray-900">{order.total_ttc} FCFA</p>
                </div>
                <div>
                  <p className="text-gray-500">Items</p>
                  <p className="font-semibold text-gray-900">
                    {(order.lignes_parfums?.length || 0) +
                      (order.lignes_accessoires?.length || 0) +
                      (order.lignes_produit_fini_essence?.length || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Delivery</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {order.statut_livraison.replace('_', ' ')}
                  </p>
                </div>
                {order.date_livraison_estimee && (
                  <div>
                    <p className="text-gray-500">Est. Delivery</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.date_livraison_estimee).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-sm text-blue-600 hover:text-blue-800">View Details →</p>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Order {selectedOrder.numero_commande}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <div className="flex flex-wrap gap-4">
                  {getStatusBadge(selectedOrder.statut)}
                  {selectedOrder.statut_livraison && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                      {getDeliveryStatusIcon(selectedOrder.statut_livraison)}
                      <span className="text-sm font-medium capitalize">
                        {selectedOrder.statut_livraison.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
                <div className="space-y-2">
                  {[
                    ...(selectedOrder.lignes_parfums || []),
                    ...(selectedOrder.lignes_accessoires || []),
                    ...(selectedOrder.lignes_produit_fini_essence || []),
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{item.nom_snapshot}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantite}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{item.prix_unitaire_snapshot} FCFA</p>
                        <p className="text-sm text-gray-500">{item.sous_total} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{selectedOrder.sous_total} FCFA</span>
                  </div>
                  {parseFloat(selectedOrder.frais_livraison) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium text-gray-900">{selectedOrder.frais_livraison} FCFA</span>
                    </div>
                  )}
                  {selectedOrder.remise_code_promo && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount ({selectedOrder.code_promo_utilise})</span>
                      <span className="font-medium text-green-600">-{selectedOrder.remise_code_promo} FCFA</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-4">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-blue-600">{selectedOrder.total_ttc} FCFA</span>
                </div>
              </div>

              {selectedOrder.statut_livraison !== 'en_attente_affectation' && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Delivery Information</h3>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Recipient:</span> {selectedOrder.livraison_nom_complet}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Phone:</span> {selectedOrder.livraison_telephone}
                    </p>
                    {selectedOrder.livraison_ville && (
                      <p className="text-gray-700">
                        <span className="font-medium">Address:</span>{' '}
                        {selectedOrder.livraison_quartier}, {selectedOrder.livraison_ville}
                      </p>
                    )}
                    {selectedOrder.livreur_nom && (
                      <p className="text-gray-700">
                        <span className="font-medium">Driver:</span> {selectedOrder.livreur_nom}
                      </p>
                    )}
                    {selectedOrder.date_livraison_estimee && (
                      <p className="text-gray-700">
                        <span className="font-medium">Est. Delivery:</span>{' '}
                        {new Date(selectedOrder.date_livraison_estimee).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.note_client && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700">{selectedOrder.note_client}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
