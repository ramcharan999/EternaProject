
````markdown
# Distributed Order Execution Engine

A high-performance, asynchronous backend system for executing crypto orders on Solana. It features a microservices architecture using **Fastify**, **BullMQ (Redis)**, and **WebSockets** to handle concurrent orders with real-time status updates.

---

## 🚀 Features

* **DEX Aggregation:** Automatically routes orders to the best price between **Raydium** and **Meteora** (Mock Implementation).
* **Asynchronous Processing:** Uses a persistent **Redis queue (BullMQ)** to handle high concurrency without blocking the API.
* **Real-time Updates:** Pushes live order status (`PENDING` → `ROUTING` → `CONFIRMED`) to clients via **WebSockets**.
* **Resilience:** Implements exponential back-off and retry logic for failed swaps.
* **Scalability:** The "Worker" service can be scaled horizontally to handle thousands of orders per minute.

---

## 🏗 Architecture

The system follows a **Producer-Consumer** pattern to ensure scalability and responsiveness.

1.  **Producer (API Service):** Accepts HTTP POST requests, validates input, and pushes a job to the Redis Queue. Returns an `orderId` immediately (Non-blocking).
2.  **Queue (Redis):** Stores jobs persistently, ensuring no orders are lost even if the server crashes.
3.  **Consumer (Worker Service):** Pulls jobs, queries the Mock DEX Router for quotes, selects the best price, and simulates execution.
4.  **WebSocket Service:** Listens for events from the Worker and broadcasts real-time updates to the specific client connected to that `orderId`.

---

## 🛠 Tech Stack

* **Language:** Node.js (v20) + TypeScript
* **Server:** Fastify (Chosen for low overhead and built-in WebSocket support)
* **Queue:** BullMQ + Redis (Dockerized)
* **Database:** PostgreSQL (Dockerized) for order history
* **Testing:** Jest (Unit & Integration tests)

---

## 📦 Setup & Installation

### Prerequisites
* Node.js (v18+)
* Docker & Docker Compose

### 1. Clone & Install
```bash
git clone [https://github.com/ramcharan999/EternaProject.git](https://github.com/ramcharan999/EternaProject.git)
cd EternaProject
npm install
````

### 2\. Start Infrastructure

Start the Redis and PostgreSQL containers using Docker Compose:

```bash
docker-compose up -d
```

### 3\. Run the Server

Start the development server with hot-reloading:

```bash
npm run dev
```

*Server will start at `http://localhost:3000`*

-----

## 🧪 Testing

The project includes a comprehensive test suite using **Jest** to verify routing logic, queue behavior, and API validation.

### Run Unit Tests

```bash
npm test
```

  * **Coverage:** 10 Tests covering Router logic, API validation, and WebSocket lifecycle.
  * **Note:** Tests use a real Redis connection (via Docker) to ensure accurate integration testing.

-----

## 🔌 API Documentation

### 1\. Submit Order (HTTP)

Queues a new market order for execution.

  * **Endpoint:** `POST /api/orders`
  * **Body:**
    ```json
    {
        "inputToken": "SOL",
        "outputToken": "USDC",
        "amount": 10
    }
    ```
  * **Response (201 Created):**
    ```json
    {
        "message": "Order queued successfully",
        "orderId": "d290f1ee-6c54-4b01-90e6-d701748f0851"
    }
    ```

### 2\. Live Updates (WebSocket)

Listen for real-time status changes for a specific order.

  * **URL:** `ws://localhost:3000/ws/orders/:orderId`
  * **Events Stream:**
    1.  `"status": "ROUTING"` - Comparing DEX prices.
    2.  `"status": "ROUTING_COMPLETE"` - Best route selected.
    3.  `"status": "CONFIRMED"` - Transaction successful (includes `txHash`).

-----

## 📝 Design Decisions

### Why Market Orders?

I chose to implement **Market Orders** to focus on optimizing the latency and throughput of the routing engine. Limit orders would require an additional internal order book and matching engine, whereas Market orders allow us to demonstrate the core value proposition: finding the best immediate price across fragmented liquidity sources.

### Why Mock Router?

A **Mock Implementation** was chosen to focus on architecture and flow.

  * **Latency Simulation:** Added artificial delays (15s for demo purposes) to mimic blockchain confirmation times and allow easy observation of WebSocket states.
  * **Price Variance:** Simulated realistic slippage between Raydium and Meteora to test the routing logic's ability to pick the best price.

-----

## 🔗 Deliverables

  * **📺 Demo Video:** [INSERT\_YOUR\_YOUTUBE\_LINK\_HERE]
  * **🚀 Live Deployment:** [INSERT\_YOUR\_RENDER\_URL\_HERE]
  * **📂 Postman Collection:** Located in the `postman_deliverables/` folder in this repository.

<!-- end list -->

```
```