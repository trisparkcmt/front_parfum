/**
 * @file lib/mock-data/orders.ts
 * @description Simulated Transaction & Delivery Datasets.
 *
 * This file provides the mock data required to populate the various 
 * dashboards (Client, Admin, Delivery, Partner).
 * 
 * **Datasets**:
 * - **`mockUsers`**: Simulated user accounts with different roles (admin, client, delivery, partner).
 * - **`mockPromoCodes`**: Promotional codes linked to specific partners for discount calculation.
 * - **`mockOrders`**: A comprehensive list of simulated customer orders, including statuses (Pending, Validated, Shipped), items purchased, and user IDs. Used by the Client and Admin dashboards.
 * - **`mockDeliveryTasks`**: A specialized view of the orders assigned to delivery personnel. Includes logistic-specific data like addresses, contact numbers, and collection amounts.
 * 
 * **Benefit**: Enables full front-end development and testing of dashboard logic without requiring a live backend database.
 */
import type { Order, User, PromoCode, DeliveryTask } from '@/types';

export const mockUsers: User[] = [
  { id: 'user-001', firstName: 'Jean', lastName: 'Kamga', email: 'jean@mail.com', phone: '+237670000001', role: 'client', roles: ['client'], createdAt: '2026-01-01' },
  { id: 'user-002', firstName: 'Marie', lastName: 'Fotso', email: 'marie@mail.com', phone: '+237670000002', role: 'client', roles: ['client'], createdAt: '2026-01-05' },
  { id: 'admin-001', firstName: 'Admin', lastName: 'Exclusif', email: 'admin@exclusif.cm', phone: '+237680254243', role: 'superadmin', roles: ['superadmin', 'client'], createdAt: '2025-12-01' },
  { id: 'deliv-001', firstName: 'Paul', lastName: 'Mbarga', email: 'paul@mail.com', phone: '+237670000003', role: 'delivery', roles: ['delivery', 'client'], createdAt: '2026-02-01' },
  { id: 'deliv-002', firstName: 'Samuel', lastName: 'Nkoulou', email: 'samuel@mail.com', phone: '+237670000004', role: 'delivery', roles: ['delivery', 'client'], createdAt: '2026-02-10' },
  { id: 'partner-001', firstName: 'Aïcha', lastName: 'Bello', email: 'aicha@mail.com', phone: '+237670000005', role: 'partner', roles: ['partner', 'client'], createdAt: '2026-01-15' },
  { id: 'partner-002', firstName: 'Kevin', lastName: 'Talla', email: 'kevin@mail.com', phone: '+237670000006', role: 'partner', roles: ['partner', 'client'], createdAt: '2026-02-20' },
];

export const mockPromoCodes: PromoCode[] = [
  { id: 'promo-001', code: 'AICHA10', discountPercent: 10, partnerId: 'partner-001', partnerName: 'Aïcha Bello', isActive: true, usageCount: 23, createdAt: '2026-01-15' },
  { id: 'promo-002', code: 'KEVIN10', discountPercent: 10, partnerId: 'partner-002', partnerName: 'Kevin Talla', isActive: true, usageCount: 15, createdAt: '2026-02-20' },
];

export const mockOrders: Order[] = [
  {
    id: 'ord-001', clientId: 'user-001', clientName: 'Jean Kamga', clientPhone: '+237670000001',
    items: [
      { id: 'oi-1', type: 'product', productName: 'Sauvage Elixir', quantity: 1, unitPrice: 95000, totalPrice: 95000 },
      { id: 'oi-2', type: 'product', productName: 'Montre Royale Or', quantity: 1, unitPrice: 185000, totalPrice: 185000 },
    ],
    subtotal: 280000, total: 280000, status: 'delivered',
    deliveryPersonId: 'deliv-001', deliveryPersonName: 'Paul Mbarga',
    createdAt: '2026-04-01', validatedAt: '2026-04-01', deliveredAt: '2026-04-02',
  },
  {
    id: 'ord-002', clientId: 'user-002', clientName: 'Marie Fotso', clientPhone: '+237670000002',
    items: [
      { id: 'oi-3', type: 'product', productName: 'Numba N°2 — Fleur de Douala', quantity: 2, unitPrice: 30000, totalPrice: 60000 },
    ],
    subtotal: 60000, promoCode: 'AICHA10', promoDiscount: 10, total: 54000, status: 'delivered',
    deliveryPersonId: 'deliv-001', deliveryPersonName: 'Paul Mbarga',
    partnerId: 'partner-001',
    createdAt: '2026-04-10', validatedAt: '2026-04-10', deliveredAt: '2026-04-11',
  },
  {
    id: 'ord-003', clientId: 'user-001', clientName: 'Jean Kamga', clientPhone: '+237670000001',
    items: [
      { id: 'oi-4', type: 'product', productName: 'Collier Perles d\'Afrique', quantity: 1, unitPrice: 95000, totalPrice: 95000 },
      { id: 'oi-5', type: 'custom-composition', productName: 'Ma Composition — Nuit Étoilée', quantity: 1, unitPrice: 42000, totalPrice: 42000 },
    ],
    subtotal: 137000, total: 137000, status: 'validated',
    deliveryPersonId: 'deliv-002', deliveryPersonName: 'Samuel Nkoulou',
    createdAt: '2026-04-28',  validatedAt: '2026-04-28',
  },
  {
    id: 'ord-004', clientId: 'user-002', clientName: 'Marie Fotso', clientPhone: '+237670000002',
    items: [
      { id: 'oi-6', type: 'product', productName: 'Lunettes Aviator Gold', quantity: 1, unitPrice: 75000, totalPrice: 75000 },
    ],
    subtotal: 75000, promoCode: 'KEVIN10', promoDiscount: 10, total: 67500, status: 'pending',
    partnerId: 'partner-002',
    createdAt: '2026-05-01',
  },
  {
    id: 'ord-005', clientId: 'user-001', clientName: 'Jean Kamga', clientPhone: '+237670000001',
    items: [
      { id: 'oi-7', type: 'product', productName: 'Bleu de Chanel', quantity: 1, unitPrice: 85000, totalPrice: 85000 },
    ],
    subtotal: 85000, total: 85000, status: 'delivering',
    deliveryPersonId: 'deliv-001', deliveryPersonName: 'Paul Mbarga',
    createdAt: '2026-04-30', validatedAt: '2026-04-30',
  },
];

export const mockDeliveryTasks: DeliveryTask[] = [
  {
    orderId: 'ord-003', clientName: 'Jean Kamga', clientPhone: '+237670000001',
    items: mockOrders[2].items, total: 137000,
    assignedAt: '2026-04-28', status: 'delivering', deliveryAddress: 'Douala, Bonapriso',
  },
  {
    orderId: 'ord-005', clientName: 'Jean Kamga', clientPhone: '+237670000001',
    items: mockOrders[4].items, total: 85000,
    assignedAt: '2026-04-30', status: 'delivering', deliveryAddress: 'Douala, Akwa',
  },
];
