# ByteOpal - A Full-Stack Proof-of-Work Blockchain

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

ByteOpal is a fully functional cryptocurrency application built from scratch. It demonstrates the fundamental principles of blockchain technology, including a UTXO-based ledger, Proof-of-Work consensus, and cryptographic wallets, all wrapped in a modern web interface.



## ## Features
This project is a comprehensive simulation of a cryptocurrency ecosystem, featuring:
* **Custom Blockchain Core:** A backend built with Node.js that implements the core logic of a blockchain, including blocks, transactions, and Proof-of-Work mining.
* **UTXO Transaction Model:** Transactions are modeled after Bitcoin's Unspent Transaction Output (UTXO) system, ensuring robust and secure value transfer.
* **Proof-of-Work (PoW) Mining:** Users can mine new blocks to process transactions and earn rewards, securing the network through computational effort.
* **Secure User Wallets:**
    * Full user registration and login system with password hashing (`bcrypt`) and JWT for sessions.
    * Automatic `secp256k1` cryptographic wallet generation for each user.
    * A secure, one-time reveal of the private key, which is then used by the owner to sign transactions.
* **Interactive Frontend:** A single-page application built with React that provides a user-friendly interface for:
    * Managing a personal wallet (viewing balance and history).
    * Sending currency to other users.
    * Initiating the mining process.
* **Public Block Explorer:** A read-only view to inspect the entire blockchain, validate its integrity, and view public transaction data.

---
## ## Technology Stack

* **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, express-session
* **Frontend:** React.js, React Router, Axios, Vite
* **Development:** `concurrently` for running both servers with a single command.

---
## ## Project Setup and Installation
To run this project locally, you will need Node.js and a running MongoDB instance.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ThaiCoder2003/byte-opal
    cd byte-opal
    ```

2.  **Configure Environment Variables**
    Create a `.env` file inside the `backend` folder and add the following:
    ```
    MONGO_URI=mongodb://localhost:27017/byteopal
    SESSION_SECRET=your_super_secret_session_key
    JWT_SECRET=your_jwt_secret_key
    ```

3.  **Install Dependencies**
    From the **root** of the project, run the following commands.
    ```bash
    # Install the root-level tool (concurrently)
    npm install

    # Install all backend and frontend dependencies
    npm run install:all
    ```

4.  **Run the Application**
    From the **root** of the project, run the main development script.
    ```bash
    npm run dev
    ```
    This will start both the backend server (on port 5001) and the React frontend (on port 3000). You can now access the application at `http://localhost:3000`.

---
## ## API Endpoint Documentation
The backend API is divided into three main route groups.

| Method | Endpoint                    | Description                                         | Auth Required |
| :----- | :-------------------------- | :-------------------------------------------------- | :------------ |
| **POST** | `/api/auth/register`        | Registers a new user and creates a wallet.          | No            |
| **POST** | `/api/auth/login`           | Logs in a user and provides a JWT cookie.           | No            |
| **GET** | `/api/auth/logout`          | Clears the JWT cookie to log the user out.          | No            |
| **GET** | `/api/auth/private-key`     | One-time endpoint to reveal the private key after registration. | Yes (Session) |
| **GET** | `/api/auth/status`          | Checks if the current user's JWT is valid.          | Yes (JWT)     |
| **GET** | `/api/wallet/balance`       | Gets the current balance for the logged-in user.    | Yes (JWT)     |
| **GET** | `/api/wallet/history`       | Gets the formatted transaction history for the user. | Yes (JWT)     |
| **POST** | `/api/wallet/transaction`   | Creates a new transaction from the user.            | Yes (JWT)     |
| **GET** | `/api/wallet/mine`          | Triggers the mining process for the logged-in user. | Yes (JWT)     |
| **GET** | `/api/blockchain/chain`     | Returns the entire raw blockchain data.             | No            |
| **GET** | `/api/blockchain/validate`  | Validates the integrity of the chain.               | No            |