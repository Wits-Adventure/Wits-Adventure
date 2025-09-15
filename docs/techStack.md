### Tech Stack

| Technology | Reason for Choice |
| :--- | :--- |
| **Firebase Auth & Firestore DB** | This was chosen primarily due to familiarity from semester 1, which saves valuable time that would otherwise be spent on learning new tools. Firebase is a robust platform that consolidates several key services, including authentication, real-time user and object data storage (Firestore), and media storage (Cloud Storage), providing an efficient, all-in-one backend solution. |
| **Vercel** | We wanted to try an alternative to Azure from semester 1 for the sake of experience. We chose Vercel (over something like AWS amplify) for it's quick deployment times, user friendliness, it allows us to host the website for a long period of time for free and we can also view preveiw deployments of different branches. |
| **Node.js** | We are using Node.js to host a backend server. This serves a dual purpose: first, it enhances security by restricting all data access to a single point of entry, using the Firebase Admin SDK. This prevents direct, unsecure database calls from every client device. Second, it acts as a load balancer, managing and limiting the flow of data requests to the database. |
| **React** | React was selected for its modular and component-based architecture. This allows us to create reusable components and objects that can be easily used across multiple pages. This approach significantly increases development speed and code maintainability compared to traditional web development with standard HTML, CSS, and JavaScript. |
| **Jest** | Jest was chosen as our testing framework because it is fast, easy to configure, and works seamlessly with React. It provides a simple API for writing unit and integration tests, supports snapshot testing, and has excellent community support.

### Note on Workflows

A separate CI/CD workflow file (such as a GitHub Actions `.yml`) is not required for this project, because the app is deployed with **Vercel**.  
Vercel automatically handles building and deploying the React app whenever changes are pushed to the connected branch.