# Battery Estimating Tool

## Getting started:

### Prerequisites: 
- npm
- Node 
- Docker desktop (https://docs.docker.com/desktop/)

#### After prerequisites are installed, complete the following steps:
1. Install dependencies with `npm run install:all`
1. Copy the .env with `cd backend | cp .env.example .env`
2. Run `docker compose up -d`
3. Run migrations with `npm drizzle-kit migrate`
4. CD back into the root folder and run `npm run dev` 

After, simply running `npm run dev` from project root will run the app.