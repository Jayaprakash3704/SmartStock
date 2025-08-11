# SmartStock - Inventory Management System

🎯 **Project Name:** SmartStock

## 📄 Abstract

SmartStock is a streamlined, user-friendly, web-based inventory management system tailored for small retail shops. It is designed to simplify and enhance the process of managing products, monitoring stock levels, and facilitating efficient decision-making based on real-time data insights.

## ✨ Features

- **🔐 Secure Authentication** - Login system with role-based access
- **📊 Interactive Dashboard** - Real-time overview of inventory statistics
- **📦 Product Management** - Add, edit, and delete products with detailed information
- **📋 Inventory Tracking** - Monitor stock levels with low-stock alerts
- **⚠️ Smart Alerts** - Automatic notifications for low inventory levels
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **🎨 Modern UI** - Clean and intuitive interface built with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation & Setup

1. **Navigate to the project directory**
   ```bash
   cd C:\Users\Jayaprakash\Desktop\mini\SmartStock
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create a .env file (optional, for Firebase)**
   ```bash
   copy .env.example .env
   ```
   Fill in Firebase config if you want to use Firebase Auth + Firestore.

4. **Start Development Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Open your browser and navigate to: `http://localhost:3000`
   - Use the demo credentials:
     - Username: `admin`
     - Password: `admin123`

### Build for Production
```bash
npm run build
```

## 🔥 Firebase Integration (optional)

If you configure Firebase credentials in `.env`:

- Authentication switches to Firebase Email/Password.
- Products are loaded/saved in Firestore (collection: `products`).
- On the first login, your local demo products migrate to Firestore automatically.

Setup steps:

1. Create Firebase Project + Web App (Firebase Console).
2. Enable Auth: Email/Password.
3. Create Firestore DB (Native mode).
4. Add the Web App config to `.env` using `.env.example` as a template.
5. Restart `npm start` to pick up env vars.

Security note: tighten Firestore security rules before production.

## Firebase setup

Create a local env file with your Firebase keys. Since this app uses Create React App, only variables prefixed with `REACT_APP_` are available to the client.

1) Create a file named `.env.local` in the project root with these keys:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id  # optional for analytics
```

2) Restart the dev server after changes to env files.

3) In Firebase Console, enable Email/Password under Authentication and add your app’s domain to the authorized domains list.

The app reads these from `process.env` in `src/services/firebase.ts` using `REACT_APP_`-prefixed variables.

## 📱 Application Features

### 🔐 Authentication
- Secure login system with demo credentials
- Session management using localStorage
- User role management

### 📊 Dashboard
- Total products overview
- Low stock alerts with visual indicators
- Inventory value calculations
- Real-time statistics

### 📦 Product Management
- Add new products with complete details
- Edit existing product information
- Delete products with confirmation
- Search and filter functionality
- Category-based organization

### 📋 Inventory Management
- Real-time stock level monitoring
- Quick stock adjustments (+10, -1 buttons)
- Editable stock quantities
- Low stock filtering
- Inventory value tracking

## 🛠️ Technology Stack

- **Frontend:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Data Storage:** LocalStorage (for demo)
- **Build Tool:** Create React App

## 🎯 Demo Credentials

- **Username:** admin
- **Password:** admin123

## 📝 Sample Data

The application includes sample products:
- Samsung Galaxy S23 (15 units, Electronics)
- Apple iPhone 15 (3 units, Electronics) - Low Stock
- Sony Headphones (8 units, Electronics)

---

**SmartStock** - Making inventory management smarter for small businesses! 🚀

## SmartStock Inventory Management System

🚀 **Live Demo:** https://smartstock-42c5d.web.app

An intelligent inventory management system built with React, TypeScript, and Firebase.

## Features
- Real-time inventory tracking
- Dashboard with analytics
- User management
- Product management
- Reports and insights

## Tech Stack
- React 18 + TypeScript
- Firebase (Firestore, Hosting)
- Tailwind CSS
- GitHub Actions (CI/CD)

## Technologies Used

- React
- TypeScript
- CSS
- Node.js (for backend services)

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.