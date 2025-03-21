# Examina-AI

## Overview
Examina-AI is an AI-powered exam preparation tool designed for students preparing for AHSEC, SEBA, and CBSE exams. It provides AI-generated questions, past papers, and personalized learning experiences.

## Features
- **AI-Generated Exam Questions** – Get topic-based questions dynamically.
- **Quiz System** – Take interactive quizzes to test your knowledge.
- **Real-Time AI Chat** – Ask AI questions and receive instant answers.
- **Gamification** – Earn points and badges based on performance.
- **Secure Authentication** – Uses Clerk for user authentication.

## Tech Stack
### Frontend:
- **Next.js (React Framework)** – Provides a fast and scalable frontend.
- **Tailwind CSS** – For styling and responsive design.
- **Clerk Authentication** – Secure user login and management.

### Backend:
- **Node.js & Express.js** – Handles API requests and business logic.
- **MongoDB & Mongoose** – Stores user data, exam questions, and scores.
- **Socket.io** – Enables real-time AI chat functionality.

### AI Integration:
- **Google Gemini API** – Generates AI-powered responses and explanations.

## Setup Instructions
### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js (v16+)** – [Download Node.js](https://nodejs.org/)
- **MongoDB (Atlas or Local Instance)** – [MongoDB Setup](https://www.mongodb.com/docs/manual/installation/)
- **Clerk API Key** – [Get a Clerk API Key](https://clerk.com/)

### Installation Steps
1. **Clone the repository**:
   ```sh
   git clone https://github.com/Abdul-Sohaib/Examina-AI.git
   cd Examina-AI
   ```
2. **Install dependencies**:
   ```sh
   cd frontend,cd my-app && npm install
   cd backend && npm install
   ```
3. **Set up environment variables**:
   Create a `.env` file in the backend directory and add the following:
   ```sh
   MONGO_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_google_gemini_api_key
   CLERK_API_KEY=your_clerk_api_key
   ```
4. **Start the backend server**:
   ```sh
   cd backend
   nodemon server
   ```
5. **Start the frontend server**:
   ```sh
   cd frontend
   cd my-app
   npm run dev
   ```
6. Open `http://localhost:3000` in your browser to access the application.

## Project Structure
```
Examina-AI/
│── frontend/          # Frontend using Next.js
│   ├── components/    # Reusable UI components
│   ├── pages/         # Application pages
│   ├── styles/        # Tailwind styles
│   └── public/        # Static assets
│── backend/           # Backend using Node.js & Express
│   ├── models/        # Database models (MongoDB)
│   ├── routes/        # API routes
│   ├── controllers/   # Business logic
│   ├── config/        # Configuration files
│   └── server.js      # Server entry point
│── .env.example       # Example environment variables
│── package.json       # Dependencies and scripts
│── README.md          # Project documentation
```

## License
This project is open-source under the **MIT License**.

## Contribution
Contributions are welcome! Follow these steps:
- Fork the repository.
- Create a feature branch.
- Submit a pull request.

---
### 🚀 Developed for the Hackathon Challenge
