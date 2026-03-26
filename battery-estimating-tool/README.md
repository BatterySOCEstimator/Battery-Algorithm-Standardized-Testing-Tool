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

## Seeding DB:
- Run `npm run dev` from `battery-estimating-tool/` to start the project
- In the browser console in the app, do (feel free to change the info)
```
await signUp({
    email: "test@test.com",
    password: "Testtesttest",
    firstName: "Test1",
    lastName: "Test",
    username: "Testuser",
    academicAffiliation: "Test", 
}); 
```
- In browser console, make sure you're logged in with your user and password:
```
await login ({
    email: "test@test.com",
	password: "Testtesttest"
});
```
- Get your `userId` from the response body after running `await getUserInfo();` in browser console
- In a new terminal in `battery-estimating-tool/`, run `cd backend`
- Run `npx tsx --env-file=.env src/utils/seed.ts USER_ID_HERE`. For example, if `userId = 8`, run `npx tsx --env-file=.env src/utils/seed.ts 8`. This should seed the DB and you should see success messages in console 
- You can test by calling endpoints in browser console like
``` 
fetch('http://localhost:8000/api/data/fetchModelData/2', {credentials: 'include'})
  .then(response => response.text())  // use text() instead of json()
  .then(data => console.log(data))
  .catch(error => console.error(error));
  ```
or
```
fetch('http://localhost:8000/api/data/fetchLeaderboardData', {credentials: 'include'})
  .then(response => response.text())  // use text() instead of json()
  .then(data => console.log(data))
  .catch(error => console.error(error));

```

Here is a list of query params and their defaults for `fetchLeaderboardData`:
```
limit = '20', \\ Number of results returned
offset = '0', \\ Number of models to offset in results (omit first n models)
order = 'asc', \\ Ascending or Descending
sortBy = 'weightedError' \\ Column to sort by
```
## Python Evaluation Tool Setup

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

4. Set the script path in `/backend/.env`:
```
   PYTHON_SCRIPT=/absolute/path/to/SETool_Python/standardized_evaluation_tool.py
```

> **Note:** Windows users will need to change `venv/bin/python3` to `venv/Scripts/python3` — or explicitly set `PYTHON_BIN` in their `.env`.


## TODO:
- Change password
- Verify email
- Change email
- SSO ?
- Cookies/Sessions