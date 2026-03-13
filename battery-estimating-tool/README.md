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

## TODO:
- Change password
- Verify email
- Change email
- SSO ?
- Cookies/Sessions