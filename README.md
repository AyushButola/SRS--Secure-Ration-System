# 🛒 Smart Ration Ledger
**Secure, Offline-First, Fraud-Resistant Ration Distribution System**

## 📌 Project Overview
Smart Ration Ledger (SRS) is a secure and transparent ration distribution system designed to eliminate fraud, duplication, and data tampering in public distribution systems.

The system works even in **low or no internet connectivity** areas and synchronizes safely once the network is restored. It uses a **hash-chained transaction ledger** to ensure data integrity and auditability.

---

## ❓ Problem Statement
Traditional ration distribution systems face several challenges:
- ❌ Duplicate or fake ration claims
- ❌ Offline data manipulation
- ❌ No tamper-proof transaction history
- ❌ Poor audit and monitoring capabilities
- ❌ Dependency on continuous internet connectivity

*This leads to leakage, corruption, and lack of trust.*

---

## ✅ Solution Summary
Smart Ration Ledger solves these problems by introducing:
- **🔗 Cryptographic hash chaining** (blockchain-inspired)
- **📴 Offline-first transaction handling**
- **🚨 Automated fraud & duplicate detection**
- **📊 Centralized audit trail**
- **👨‍💼 Admin-controlled conflict resolution**

---

## 🌟 Key Features
- **Hash-Chained Ledger**: Every transaction links to the previous one, preventing tampering.
- **Offline Mode Support**: Shops can distribute rations even without internet.
- **Automatic Sync & Conflict Detection**: Offline transactions are synced safely when connectivity returns.
- **Fraud Prevention**: Detects double spending, duplicates, and data tampering.
- **Audit Trail**: Immutable logs for every transaction and sync event.
- **Admin Dashboard**: Central monitoring and manual resolution when needed.

---

## 🧱 System Architecture

![System Architecture - DFD](Static/DFD.jpeg)

### User Flow
![User Flow](Static/UserFlow.jpeg)

### Shop Flow
![Shop Flow](Static/shopflow.jpeg)


### The architecture consists of:
1. **User Mobile**: QR-based identification
2. **Shop Device**: Online/Offline capable POS/App
3. **Central Server**: Sync and validation
4. **Hash Ledger Database**: Immutable record keeping
5. **Admin Console**: Monitoring and management
6. **Backup & Offline Storage**: Ensuring data availability

---

## 🗄️ Database Design
The system uses a relational database combined with an append-only transaction ledger.

### Core Tables
* `beneficiaries`
* `ration_shops`
* `ration_items`
* `entitlements`
* `transactions`
* `ledger_state`
* `conflicts`
* `sync_logs`

![ER Diagram](Static/ER_Diagram.jpeg)

---

## 🔄 Transaction Flow

### Online Transaction
1. User scans QR at shop.
2. Beneficiary details fetched from server.
3. Quota validated.
4. Transaction hash generated.
5. Transaction committed to ledger.
6. Receipt generated.

### Offline Transaction
1. Transaction stored locally.
2. Hash generated using last known state.
3. Transaction queued.
4. Synced when network is restored.
5. Conflicts handled centrally.

![Transaction Flow Diagram](Static/UserFlow.jpeg)

---

## 🔐 Security & Hash Chain Logic
Each transaction contains:
- `Previous hash`
- `Current transaction hash`

*Any modification breaks the chain. Invalid hashes are quarantined automatically.*

![Hash Chain Diagram Placeholder](https://via.placeholder.com/800x400?text=Hash+Chain+Logic)

---

## ⚠️ Conflict Handling
The system detects:
- Duplicate transactions
- Double spending
- Hash mismatches
- Offline sync conflicts

**Conflicts are:**
- Automatically flagged
- Logged in audit trail
- Resolved by admin when required

![Conflict Resolution Diagram](Static/ConflictResolveDesign.jpeg)

---

## 👨‍💼 Admin Dashboard
Admin can:
- Monitor system health
- Review flagged transactions
- Block users or shops
- View audit logs
- Generate reports

![Admin Workflow Diagram](Static/adminFLow.jpeg)

---

## ⚙️ Setup & Installation

### 1. Database & Environment Setup
This project uses **PostgreSQL**. You can use a local instance or a cloud provider like [NeonDB](https://neon.tech).

1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```

2.  Create a `.env` file in the `backend` directory with the following variables:
    ```env
    PORT=3000
    DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
    JWT_SECRET=your_super_secret_key
    ```

3.  Install dependencies:
    ```bash
    npm install
    ```

4.  Initialize the Database Schema:
    You can run the initialization script manually:
    ```bash
    node src/scripts/initDb.js
    ```
    *Alternatively, the schema is automatically checked and created when you start the server.*

5.  Start the Server:
    ```bash
    npm run dev
    ```

---

## 🛠️ Tech Stack (Current / Planned)

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML, CSS, JavaScript |
| **Shop Device** | Web / Android App |
| **Backend** | Node.js / Express |
| **Database** | PostgreSQL |
| **Hashing** | SHA-256 (bcryptjs) |
| **APIs** | REST |
| **Deployment** | Docker / Cloud VM |

---

## 📈 Scalability & Reliability
- **Prioritize fast writes**: Append-only ledger
- **Offline batching**: Reduces server load
- **Stateless backend APIs**: Easy scaling
- **Backup and recovery**: Fully supported