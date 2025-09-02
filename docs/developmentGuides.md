# Building a Secure and Modular Node.js API

This guide walks you through the key concepts of creating a robust backend server using Node.js, Express, and Firebase.  
We focus on securing API endpoints and how your frontend code (specifically your `apiRequest` function) interacts with the backend to ensure every call is authenticated.

---

## 1. Backend Architecture: A Modular Approach

Instead of a single, monolithic file, a well-structured backend uses a modular design to keep the codebase clean and manageable.  
Your project structure should look something like this:

```
/my-api-project
├── index.js          # The main server file
├── /functions
│   └── auth.js       # All shared middleware, like authentication
└── /routes
    ├── users.js      # Endpoints for all user-related actions
    └── quests.js     # Endpoints for all quest-related actions
```

- **index.js**: The entry point of your application. Initializes Firebase, applies global middleware (like `cors` and `express.json`), and mounts your route files. Acts as the central hub for your API.
- **functions/auth.js**: Contains your `authenticate` function. A reusable "gatekeeper" that checks for a valid authentication token on incoming requests before they can access a protected endpoint.
- **routes/*.js**: Contains business logic for specific parts of your application (e.g., users, quests). Defines the actual API endpoints (`GET`, `POST`, `PATCH`, `DELETE`).

---

## 2. Securing Your Endpoints with the `authenticate` Middleware

The `authenticate` function is crucial for backend security.  
In Express, a middleware is a function that has access to the request and response objects and can perform tasks before the final endpoint logic is executed.

### How `authenticate` Works

1. **Extract the Token**: Looks for the `Authorization` header, specifically for a token formatted as `Bearer [your-token]`.
2. **Verify with Firebase**: Uses `admin.auth().verifyIdToken(idToken)` to securely validate the token. Firebase checks that the token is valid, hasn't expired, and was issued for your application.
3. **Attach User Data**: If valid, Firebase returns a `decodedToken` containing the user's info (including `uid`). The middleware attaches this to `req.user`.
4. **Allow or Deny**:
    - If valid, calls `next()`, allowing the request to proceed.
    - If missing or invalid, sends a `401 Unauthorized` response.

### Applying the Middleware

To protect an endpoint, pass `authenticate` as middleware before your main function:

```javascript
router.post('/', authenticate, async (req, res) => {
  // The `req.user` object is now available!
  // You can use `req.user.uid` for authorization checks.
  if (req.user.uid !== req.body.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // ...
});
```

This pattern ensures that no unauthorized request can reach your sensitive database logic.

---

## 3. Making Secure Calls from the Frontend with `apiRequest`

On the frontend, your `apiRequest` function centralizes all logic for making secure, authenticated API calls.

### How `apiRequest` Works

1. **Get the ID Token**: Checks for the current authenticated user and retrieves their Firebase ID token using `auth.currentUser.getIdToken()`.
2. **Add to Header**: Automatically adds this token to the `Authorization` header in the correct Bearer format.
3. **Handle Data**: Handles JSON data by setting the `Content-Type` header and stringifying the body.
4. **Send Request**: Uses the `fetch` API to send the request to your backend.

### Example Usage

Because `apiRequest` handles all the complex parts, your UI code remains clean and simple.

```javascript
import { apiRequest } from './api';

// Example 1: Secure GET request
const userId = 'abc-123';
const userData = await apiRequest(`/api/users/${userId}`);
// The `Authorization` header with the token is added automatically!

// Example 2: Secure POST request with a body
const questData = { name: 'Go to a park', lat: 12.34, lng: 56.78 };
const response = await apiRequest('/api/quests', 'POST', questData);
// The `Authorization` and `Content-Type` headers are added automatically!
```

---

## 4. The Power of this Combined Approach

This architecture provides a complete, secure, and scalable solution:

- **Security**: The `authenticate` middleware acts as a single point of failure for security. If a request doesn't have a valid token, it never reaches your core application logic.
- **Modularity**: `apiRequest` and `authenticate` are reusable components. Write them once and use them everywhere, reducing code duplication.
- **Maintainability**: When you need to update a security rule or change how you get a

## How to create a development database (Firestore & Storage)

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable Firestore and Storage in your project settings.
3. Create your collections (`Users`, `Quests`, etc.) and add sample/test data as needed.
4. In Firebase Storage, create folders for storing images (e.g., `quest_submissions/`).
5. Download your Firebase config and add it to your React project (usually in `src/firebase/firebase.js`).

## How to create a development site (React on Vercel)

1. Clone your frontend repository.
2. Run `npm install` to install dependencies.
3. Add your Firebase config to `src/firebase/firebase.js`.
4. Start the development server with `npm start`.
5. Connect your frontend to the development API and Firestore.
6. For deployment, push your code to GitHub and connect the repo to Vercel.
7. Set environment variables in Vercel for your Firebase config and API URLs.
8. Deploy and test your site at your Vercel domain.
