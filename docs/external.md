### HTML Geolocation API

We use the **HTML Geolocation API** because it provides a simple, built-in way to access the user’s current location directly through the browser, without needing any external services. This makes it:

- **Lightweight** and easy to implement
- **Available across most modern devices and browsers**
- **No API key or billing setup required**
- **No network requests to external providers for basic location access**

This approach reduces cost, improves privacy (since location data is only shared locally with the browser), and keeps the project more maintainable.  
For our use case—checking whether users are within a certain radius of a quest location—the HTML Geolocation API gives us all the accuracy and functionality we need without unnecessary overhead.

---

### Leaflet

We use **Leaflet**, an open-source JavaScript library for building interactive maps, because it is:

- **Lightweight, fast, and highly customizable**
- Provides essential features such as **zooming, panning, and adding markers or custom layers**
- Enables us to show user locations, quests, and routes on an intuitive map interface, enhancing the overall user experience
- Has strong community support and compatibility with various map providers

Leaflet is a practical and efficient choice for integrating real-time, location-based features into our application.