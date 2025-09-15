## Running the Application Locally

To run this application locally, please follow these steps in your terminal:

```sh
npm install
npm start
```

- This will install all dependencies and start the development server.
- The app will be available at [http://localhost:3000](http://localhost:3000) by default.

If you want to build the app for production, run:

```sh
npm run build
```

## Demo Account

To quickly explore the app, you can log in with this demo account:

- **Username:** <code class="case-sensitive">wits_adventure_student@outlook.com</code>
- **Password:** <code class="case-sensitive">BlooBase2</code>

## Using the API

You can interact with the backend API securely from your frontend using the provided `apiRequest` function. This function automatically handles authentication and headers for you.

### Example: Fetching User Data

```js
import { apiRequest } from './api';

const userId = 'your-user-id';
const userData = await apiRequest(`/api/users/${userId}`);
// userData now contains the user's information
```

### Example: Creating a Quest

```js
const questData = { name: 'Go to a park', lat: 12.34, lng: 56.78 };
const response = await apiRequest('/api/quests', 'POST', questData);
// response contains the result of your quest creation
```

**Note:**  
- You must be logged in; `apiRequest` will automatically include your authentication token.
- All API endpoints are protected and require a valid token.

For more advanced usage and backend details, see [developmentGuides.md](./developmentGuides.md).
