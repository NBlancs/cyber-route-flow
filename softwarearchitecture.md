``` mermaid
graph LR
    %% Frontend Layer
    subgraph "Frontend Layer (React + TypeScript)"
        direction TB
        subgraph "Pages"
            Dashboard[Dashboard]
            Shipments[Shipments]
            Customers[Customers]
            POD[Proof of Delivery]
            UserDash[User Dashboard]
        end
        
        subgraph "Components"
            ShipmentTracker[Shipment Tracker]
            DeliveryMap[Delivery Map]
            CustomerList[Customer List]
            ShipmentForm[Shipment Form]
            Header[Header/Navigation]
        end
        
        subgraph "Core"
            Router[React Router]
            Auth[Auth Provider]
            Hooks[Custom Hooks]
            Utils[Utilities]
        end
        
        subgraph "UI Framework"
            Shadcn[shadcn/ui]
            Tailwind[Tailwind CSS]
        end
    end

    %% Data Management Layer
    subgraph "Data Management"
        direction TB
        ReactQuery[React Query<br/>State Management]
        SupabaseClient[Supabase Client<br/>API Layer]
        CacheManager[Cache Manager<br/>Performance]
    end

    %% Backend Services
    subgraph "Supabase Backend"
        direction TB
        subgraph "Database"
            DB[(PostgreSQL)]
            ShipmentsTable[Shipments Table]
            CustomersTable[Customers Table]
            ProfilesTable[Profiles Table]
            PODTable[POD Table]
        end
        
        subgraph "Services"
            Auth2[Authentication]
            EdgeFunctions[Edge Functions]
            ShippingFunc[Shipping API]
            PaymentFunc[Payment API]
        end
    end

    %% External APIs
    subgraph "External Services"
        direction TB
        Lalamove[Lalamove API<br/>Shipping & Logistics]
        PayMongo[PayMongo API<br/>Payment Gateway]
        Mapbox[Mapbox API<br/>Maps & Geocoding]
    end

    %% Build & Deployment
    subgraph "Build Pipeline"
        direction TB
        Vite[Vite<br/>Build Tool]
        Bun[Bun<br/>Package Manager]
        Vercel[Vercel<br/>Hosting Platform]
    end

    %% Main Data Flow (Left to Right)
    Pages --> Components
    Components --> Core
    Core --> ReactQuery
    ReactQuery --> SupabaseClient
    SupabaseClient --> Database
    SupabaseClient --> Services
    Services --> Lalamove
    Services --> PayMongo
    DeliveryMap --> Mapbox

    %% Additional Connections
    Components --> Shadcn
    Shadcn --> Tailwind
    Utils --> CacheManager
    Vite --> Vercel

    %% Color coding for different layers
    classDef frontend fill:#39FF14,stroke:#1A1F2C,stroke-width:2px,color:#000
    classDef data fill:#1EAEDB,stroke:#39FF14,stroke-width:2px,color:#fff
    classDef backend fill:#8E44AD,stroke:#39FF14,stroke-width:2px,color:#fff
    classDef external fill:#FF6B35,stroke:#39FF14,stroke-width:2px,color:#fff
    classDef build fill:#2ECC71,stroke:#39FF14,stroke-width:2px,color:#fff

    class Dashboard,Shipments,Customers,POD,UserDash,ShipmentTracker,DeliveryMap,CustomerList,ShipmentForm,Header,Router,Auth,Hooks,Utils,Shadcn,Tailwind frontend
    class ReactQuery,SupabaseClient,CacheManager data
    class DB,ShipmentsTable,CustomersTable,ProfilesTable,PODTable,Auth2,EdgeFunctions,ShippingFunc,PaymentFunc backend
    class Lalamove,PayMongo,Mapbox external
    class Vite,Bun,Vercel build
```