'use client';

import React, { useEffect, useState } from 'react';
import { orderService } from '@/services/apiService';
import { BackendOrder } from '@/types';
import { AlertCircle, Loader, MapPin, Phone, DollarSign, CheckCircle, Clock, X } from 'lucide-react';

export default function LivreurOrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchAssignedOrders();
    const interval = setInterval(fetchAssignedOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAssignedOrders = async () => {
    try {
      setError(null);
      const response = await orderService.getAssignedOrders();
      setOrders(response.results || response);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsDelivered = async (order: BackendOrder) => {
    if (!confirm('Mark this order as delivered?')) return;

    setIsUpdating(true);
    try {
      await orderService.updateDeliveryAction(order.numero_commande, {
        action: 'livrer',
      });
      alert('Order marked as delivered');
      setSelectedOrder(null);
      fetchAssignedOrders();
    } catch (err: any) {
      console.error('Failed to update order:', err);
      alert('Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsFailed = async (order: BackendOrder) => {
    const reason = prompt('Please provide a reason for the failed delivery:');
    if (!reason) return;

    setIsUpdating(true);
    try {
      await orderService.updateDeliveryAction(order.numero_commande, {
        action: 'echouer',
        motif: reason,
      });
      alert('Delivery marked as failed');
      setSelectedOrder(null);
      fetchAssignedOrders();
    } catch (err: any) {
      console.error('Failed to update order:', err);
      alert('Failed to update order');
    } finally {
      setIsUpdating(false);
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
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-8 rounded-lg">
        <h1 className="text-4xl font-bold mb-2">My Deliveries</h1>
        <p className="text-green-100">Track and complete assigned orders</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">No assigned deliveries</p>
          <p className="text-gray-500">Assigned orders will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-green-400 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    Order {order.numero_commande}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.date_creation).toLocaleDateString()}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  <Clock size={16} />
                  <span className="text-sm font-medium">In Progress</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-gray-400" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-semibold text-gray-900">{order.total_ttc} FCFA</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-gray-400" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Delivery Area</p>
                    <p className="font-semibold text-gray-900">{order.livraison_ville || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="text-gray-400" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Client Phone</p>
                    <p className="font-semibold text-gray-900">{order.livraison_telephone}</p>
                  </div>
                </div>
                {order.date_livraison_estimee && (
                  <div>
                    <p className="text-xs text-gray-500">Est. Delivery</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.date_livraison_estimee).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-sm text-green-600 hover:text-green-800">View Details →</p>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Delivery {selectedOrder.numero_commande}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                disabled={isUpdating}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Client Information</h3>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span> {selectedOrder.livraison_nom_complet}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Phone:</span>{' '}
                    <a href={`tel:${selectedOrder.livraison_telephone}`} className="text-blue-600 hover:underline">
                      {selectedOrder.livraison_telephone}
                    </a>
                  </p>
                  {selectedOrder.livraison_ville && (
                    <p className="text-gray-700">
                      <span className="font-medium">Area:</span> {selectedOrder.livraison_quartier},{' '}
                      {selectedOrder.livraison_ville}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                  <p className="text-gray-800 font-medium">
                    {selectedOrder.livraison_nom_complet}
                  </p>
                  <p className="text-gray-700 mt-1">
                    {selectedOrder.livraison_quartier}, {selectedOrder.livraison_ville}
                  </p>
                  <p className="text-gray-700 mt-1">
                    <strong>Phone:</strong> {selectedOrder.livraison_telephone}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Items to Deliver</h3>
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
                        <p className="text-sm text-gray-500">{item.prix_unitaire} FCFA each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">{selectedOrder.total_ttc} FCFA</span>
                </div>
              </div>

              {/* Customer Notes */}
              {selectedOrder.note_client && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer Notes</h3>
                  <p className="text-gray-700 bg-yellow-50 p-3 rounded">{selectedOrder.note_client}</p>
                </div>
              )}

              {/* Delivery Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Delivery Status</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleMarkAsDelivered(selectedOrder)}
                    disabled={isUpdating}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-green-400"
                  >
                    <CheckCircle size={20} />
                    Mark as Delivered
                  </button>
                  <button
                    onClick={() => handleMarkAsFailed(selectedOrder)}
                    disabled={isUpdating}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:bg-red-400"
                  >
                    <AlertCircle size={20} />
                    Mark as Failed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
