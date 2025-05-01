# Project Name: Logistics and Distribution (CYBERROUTE)

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```
# Technologies and Tools

## Tools/Technologies Used
- **Front-end:** Vite + React (TypeScript), Tailwind CSS, shadcn-ui
- **Back-end:** Laravel
- **Database:** Supabase
- **Project Management Tool:** Notion
- **Deployment:** Vercel

## APIs
- **Supabase:** Database and Authentication API
- **PayMongo:** Payment Gateway API
- **Lalamove API:** Shipping API
- **Mapbox API:** Maps API

---

# Design and Theme

Design a sleek, futuristic website that merges glassy, translucent interfaces with a vibrant **neon green (#39FF14)** palette, evoking a high-tech, holographic environment.  
The theme should balance **transparency, depth, and cybernetic energy**, creating an immersive experience that feels both **cutting-edge** and **elegantly minimalist**.

---

# Logistics and Distribution

Manages the **physical movement of goods**, from planning delivery routes to tracking shipments, ensuring timely delivery and seamless integration with inventory systems.

### Delivery Route Planning
- **Geography-Based Route Optimization:**  
  Uses map-based integration to plan the most efficient delivery routes, considering factors like location, road conditions, traffic data, and delivery urgency.  
- **Dynamic Route Adjustments:**  
  Real-time updates based on traffic, weather, or unexpected delays to optimize delivery times.  
- **Prioritization of Orders:**  
  Routes are optimized based on the priority of orders, allowing urgent deliveries to be prioritized while ensuring efficient use of fleet resources.  

### Third-Party Logistics (3PL) Integration
- **Assigning Shipments to Internal or 3PL Providers:**  
  Automatically assigns shipments to the best-fit carrier, whether it’s an internal logistics team or an external **third-party logistics (3PL)** provider.  
- **3PL Coordination:**  
  Communicates real-time updates and status changes with 3PL providers to ensure accurate delivery tracking and reporting.  

### Shipping Documentation Generation
- **Packing Slips & Bills of Lading:**  
  Automatically generates necessary shipping documents (e.g., packing slips, bills of lading, commercial invoices) based on the order details.  
- **Customizable Document Templates:**  
  Supports customizable templates for different types of shipments, customers, and regulatory requirements.  

### Shipment Tracking & Proof of Delivery (POD)
- **Real-Time Shipment Tracking:**  
  Tracks shipments in real-time through integration with GPS systems, third-party tracking services, or barcode/RFID scanning, providing visibility throughout the journey.  
- **Proof of Delivery (POD):**  
  Captures **Proof of Delivery (POD) electronically**, with customers signing on handheld devices or mobile apps, ensuring goods are delivered correctly and on time.  

### Delivery Performance Metrics Monitoring
- **On-Time Delivery Rate:**  
  Tracks and reports **on-time delivery performance**, highlighting delays or bottlenecks in the delivery process.  
- **Damage Reports:**  
  Monitors damaged shipments upon arrival, providing data for **claims or returns processing** and identifying trends in handling or carrier performance.  

### Map Integration for Delivery Routes
- **Dynamic Map-Based Visualizations:**  
  Visualizes delivery routes on an interactive map, allowing logistics managers to see planned routes, track deliveries, and make adjustments if needed.  
- **Real-Time Location Updates:**  
  Provides live updates of delivery vehicles' locations, **helping manage customer expectations** and ensuring deliveries remain on schedule.  

### Auto Update Inventory for Delivered Goods
- **Real-Time Inventory Sync:**  
  Once goods are delivered, the system **automatically updates** the inventory, removing shipped items from warehouse stock.  
- **Integration with Inventory Management:**  
  The inventory system updates in **real-time**, adjusting stock levels accordingly.  
- **Backorder Management:**  
  Automatically triggers **restocking requests** if inventory is low post-delivery or flags backorders for unfulfilled items.  

---

# Order Management Rules

## Customer Account Management
1. **Customer information** (billing, shipping, contacts) must be accurately stored in a centralized database.  
2. Each **customer account** must have a defined **credit limit** based on their **payment history**.  
3. Customer **data changes (e.g., address, credit limit)** require manager approval.  
4. **Customer segmentation** (region, industry, purchasing behavior) should help target marketing efforts.  
5. New customers must undergo **background checks** before their account is activated.  

## Sales Transaction Processing
1. Sales **quotations must be approved** before converting into an order.  
2. Accepted quotations must be **automatically converted** into sales orders to reduce errors.  
3. **Invoices must be generated** once an order is shipped, with payments tracked.  
4. Each order status should be **tracked in real-time** (pending, confirmed, shipped).  

## Promotions and Loyalty Programs
1. **Discounts and coupon codes** must follow predefined eligibility rules.  
2. **Promotions should apply automatically** during checkout based on campaign periods.  
3. **Loyalty points** must accumulate based on customer purchases and be redeemable.  

---

# Data Visualization Rules

## Sales Trend Visualization
1. Sales trends must be **visualized with graphs and charts** for tracking performance.  
2. Data segmentation should allow analysis by **product, region, customer type, or sales representative**.  
3. **Heatmaps, bar charts, and line graphs** should facilitate quick insights into metrics.  

## Price Trend Visualization
1. Historical **price data tracking** must be displayed alongside **sales volume**.  
2. **Price elasticity and adjustments** should be analyzed to improve profitability.  
3. System should generate **alerts for significant price changes** or deviations.  

---


