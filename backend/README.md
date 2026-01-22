# SRS Backend Documentation

Secure Ration System (SRS) Backend Service.
Built with Node.js, Express, and PostgreSQL.

## 🚀 Setup & Installation

1.  **Prerequisites**:
    *   Node.js (v18+)
    *   PostgreSQL (v14+)

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file:
    ```env
    PORT=3000
    DB_USER=postgres
    DB_HOST=localhost
    DB_NAME=srs_db
    DB_PASSWORD=yourpassword
    DB_PORT=5432
    JWT_SECRET=supersecretkey
    ```

4.  **Database Migration**:
    Run the schema initialization script:
    ```bash
    node src/scripts/updateSchema.js
    ```
    (Or `createLedgerTable.js` / `linkShopToUser.js` if running incrementally).

5.  **Run Server**:
    ```bash
    npm run dev
    ```

---

## 📂 Project Structure

*   `src/options` - Configuration (DB, Env)
*   `src/controllers` - Request Logic
*   `src/services` - core business logic (Ledger, Crypto)
*   `src/models` - SQL Schema
*   `src/routes` - API Route Definitions
*   `src/utils` - Helpers (Crypto, Hash)
*   `src/scripts` - Maintenance & Test Scripts

---

## 🔌 API Endpoints

### 1. Authentication (`/api/auth`)
*   **POST** `/register` - Register a new user (Admin/Shop).
*   **POST** `/login` - Login and receive JWT Token.
*   **GET** `/me` - Get current user details.

### 2. Shops (`/api/shops`)
*   **POST** `/register` - Register a new Ration Shop.
    *   *Body*: `{ email, password, shop_id, shop_name, location, device_id }`
    *   Creates both User (Shop Owner) and Shop (Pending) records.
*   **GET** `/pending` - List pending shops (Admin only).
*   **PUT** `/:id/approve` - Approve a shop (Admin only).

### 3. Beneficiaries (`/api/beneficiaries`)
*   **POST** `/create` - Create a new beneficiary (Admin/Shop).
*   **GET** `/:id` - Get details.
*   **GET** `/:id/entitlements` - Get ration quota for current month.
    *   Returns: `[{ commodity, max_quantity, consumed_quantity }]`

### 4. Transactions (`/api/transactions`)
*   **POST** `/process` - **(Online Logic)**
    *   Process a single real-time transaction.
    *   *Body*: `{ shop_id, beneficiary_id, commodity, quantity }`
    *   *Logic*: Checks quota -> Generates Hash -> Updates Ledger -> Returns Receipt.

*   **POST** `/sync` - **(Offline Logic)**
    *   Upload a batch of offline transactions.
    *   *Body*: `{ shop_id, transactions: [ ... ] }`
    *   *Logic*: Validates Hash Chain sequentially. Rejects fork/mismatch.

---

## 🔐 Core Logic (Security)

### Hash Chains
Every transaction is cryptographically linked to the previous one to prevent tampering.
*   **Formula**: `Hash = SHA256( PrevHash + Shop + User + Item + Qty + Time )`
*   **Ledger State**: The `ledger_state` table tracks the *latest* valid hash for every shop.

### Offline Sync
1.  Shops calculate hashes locally when offline.
2.  When syncing, the server verifies `Txn[0].prev_hash == Server.LastHash`.
3.  If valid, `Server.LastHash` advances to the new tip.

---

## 🛠 verification Scripts
Located in `src/scripts/`:
*   `testCrypto.js`: Test hash generation and ledger updates.
*   `testTransaction.js`: Test online transaction flow.
*   `testSync.js`: Test offline batch sync flow.
