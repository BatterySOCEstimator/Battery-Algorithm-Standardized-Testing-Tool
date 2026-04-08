# Battery Estimating Tool

## Getting Started

### Prerequisites
- Node.js & npm
- Docker Desktop ([install here](https://docs.docker.com/desktop/))

### Setup -- Dev

1. Install dependencies:
```bash
   npm run install:all
```
2. Set up the backend environment:
```bash
   cd backend
   cp .env.example .env
```
3. Start the database:
```bash
   docker compose up -d
```
4. Run migrations:
```bash
   npx drizzle-kit migrate
```
5. From the project root, start the app:
```bash
   cd ..
   npm run dev
```

After initial setup, just run `npm run dev` from the project root.

---



## Python Evaluation Tool Setup

The evaluation tool runs user-submitted models inside a **sandboxed Docker container** for security. No local Python virtual environment is needed in production — Docker handles everything.

### How It Works

When a model is submitted, the backend:
1. Copies the uploaded model file into a temporary working directory
2. Spins up an isolated Docker container with the evaluation script and test data
3. Runs the model against standardized battery datasets
4. Captures the evaluation results (metrics like weighted error, RMSE, etc.)
5. Stores the results in Postgres and cleans up the container

### Setup

1. Make sure Docker Desktop is running.

2. Build the evaluator image from `battery-estimating-tool`:
```bash
   build -f Dockerfile.evaluator -t socapp-evaluator .
```
> **Note:** This image is **not** a long-lived service -- the backend spawns a container per evaluation and removes it when done.



3. Ensure the following are set in `backend/.env`:

### Account creation
To be able to access the upload file page and submission you must be logged in. Create an account through the regstration page, 
verify your email and then login.

### Local Development (without Docker evaluator)

If you want to run the evaluation script directly for development/debugging:

1. Navigate to the evaluation tool directory:
```bash
   cd SETool_Python
```
2. Create a virtual environment:
```bash
   python3 -m venv venv
```
3. Activate it and install dependencies:
```bash
   source venv/bin/activate        # Mac/Linux
   venv\Scripts\activate           # Windows
   pip install numpy pandas scipy matplotlib
   deactivate
```
4. Set the script path in `backend/.env`:
PYTHON_SCRIPT=/absolute/path/to/SETool_Python/standardized_evaluation_tool.py

> **Note:** Windows users need to change `venv/bin/python3` to `venv/Scripts/python3` — or set `PYTHON_BIN` explicitly in `.env`.

---

### Leaderboard Query Params

| Param    | Default           | Description                          |
|----------|-------------------|--------------------------------------|
| `limit`  | `20`              | Number of results returned           |
| `offset` | `0`               | Number of models to skip             |
| `order`  | `asc`             | `asc` or `desc`                      |
| `sortBy` | `weightedError`   | Column to sort by                    |

---

