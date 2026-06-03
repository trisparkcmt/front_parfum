/**
 * @file lib/mock-data/index.ts
 * @description Centralized Mock Data Export Hub.
 *
 * This file serves as the main entry point for retrieving all simulated datasets 
 * within the application. It aggregates and re-exports data from specialized 
 * files (products, essences, orders) to simplify imports in components.
 * 
 * **Re-exports**:
 * - **`mockEssences`**: Scent profiles for the Numba Atelier.
 * - **`mockAccessories` / `mockPerfumes`**: Catalog data for the Shop.
 * - **`mockUsers` / `mockOrders`**: Session and transaction data for dashboards.
 */
export { mockEssences, mockPremiumEssences } from './essences';
export { mockAccessories, mockPerfumes, allProducts } from './products';
export { mockUsers, mockPromoCodes, mockOrders, mockDeliveryTasks } from './orders';
