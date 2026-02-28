# 🚀 How to Run the Project

Follow these steps in order to get all modules running correctly.

### 1. Setup AI Server (Crucial for AI Assistant)
1. Open `c:\Users\dines\dynamic-legal-lexicon\AI Integration\.env`
2. **Replace** `YOUR_GEMINI_API_KEY_HERE` with your actual key from [Google AI Studio](https://aistudio.google.com/).
3. Open a terminal and run:
   ```powershell
   cd "AI Integration"
   npm run dev
   ```
   *Should show: AI Server started on http://localhost:5002*

### 2. Start Backend
1. Open a new terminal and run:
   ```powershell
   cd backend
   npm run dev
   ```
   *Should show: Server running on port 5000*

### 3. Start Frontend
1. Open a new terminal and run:
   ```powershell
   cd frontend
   npm run dev
   ```
   *Should show: VITE ... http://localhost:5173*

### 4. Import Data (Optional)
If your database is empty:
1. Go to `http://localhost:5173/login`
2. Login as **Admin**.
3. Go to **Admin Panel** → **Import CSV** and select your legal terms dataset.
