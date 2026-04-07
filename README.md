# Planning Poker Studio

A professional, real-time estimation workspace built for agile teams who demand high-fidelity collaboration tools. Synchronize your team's vision with precision and speed.

---

## 🚀 Getting Started

Master the production setup with **Yarn**. Follow these steps to launch your local real-time environment.

### 1. Prerequisite Hydration
Ensure you have **Node.js** and **Yarn** installed. The core engine requires a **PostgreSQL** database for real-time state persistence.

### 2. Dependency Installation
Hydrate the application logic and build the lockfile:
```bash
yarn install
```

### 3. Environment Calibration
Configure your local secrets by referencing `.env.example`:
```bash
# Ensure your DATABASE_URL is correctly pointed to your Postgres instance
cp .env.example .env
```

### 4. Prisma Engine Setup
Generate the client to interface with the PostgreSQL core:
```bash
yarn prisma:generate
```

### 5. Launch Development Studio
Start the custom Next.js + Socket.io server in watch mode:
```bash
yarn dev
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Engine**: TypeScript & tsx
- **Real-time**: Socket.io
- **Data Architecture**: Prisma (PostgreSQL)
- **Tooling**: Yarn

---

## ✒️ Author

**Amrishkhan Sheik Abdullah**  
Lead Developer | Elite Systems Architect  
[amrishkhan05@gmail.com](mailto:amrishkhan05@gmail.com)

---

> [!IMPORTANT]
> This application reaches its full fidelity when connected to a production-ready PostgreSQL database on port 5432. Verification of the `DATABASE_URL` is critical for a successful launch.
