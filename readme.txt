
## 🚀 Getting Started

Follow these steps to set up and run the project locally using VS Code.

### Prerequisites

* **VS Code:** Download and install Visual Studio Code from [code.visualstudio.com](https://code.visualstudio.com/).
* **Node.js & npm:** Ensure you have Node.js (which includes npm, the Node Package Manager) installed. Download from [nodejs.org](https://nodejs.org/).
* **MongoDB:** Install MongoDB Community Server. Download from [mongodb.com](https://www.mongodb.com/try/download/community).

### Backend Setup (Job Portal API)

1.  **Open Project in VS Code:**
    * Open VS Code.
    * Go to `File` > `Open Folder...`
    * Select the root `tendersTendersStaff-website` folder.
2.  **Open Integrated Terminal for Backend:**
    * In VS Code, go to `Terminal` > `New Terminal`.
    * In the terminal, navigate to the backend directory:
        ```bash
        cd "Job Portal/Backend"
        ```
3.  **Install Backend Dependencies:**
    Run the following command to install all necessary Node.js packages for the backend:
    ```bash
    npm install
    ```
    This may take a moment.
4.  **Seed the Database (Optional but Recommended):**
    This script will populate your MongoDB with some initial job data. Run it once:
    ```bash
    node seedDb.js
    ```
    You should see a message like "MongoDB connected for seeding." and "Initial job data seeded successfully!".
5.  **Start the Backend Server:**
    Once dependencies are installed and the database is optionally seeded, start the server. This will run the API that the Job Listings page (`jobs.html`) communicates with.
    ```bash
    npm start
    # Or, if you have `nodemon` installed globally for development with auto-restarts on file changes:
    # npm run dev
    ```
    You should see messages indicating the server is running (e.g., "Server running on port 3000" and "MongoDB connected successfully!"). Keep this terminal window open and the server running while you use the frontend.

### Frontend Setup & Running

1.  **Open Frontend in VS Code (if not already open):**
    If you followed the backend steps, your `tendersTendersStaff-website` root folder should already be open in VS Code.
2.  **Install Live Server Extension (Recommended):**
    * Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X).
    * Search for "Live Server" by Ritwick Dey and install it. This extension provides a local development server with live reload.
3.  **Launch the Website:**
    * In the VS Code Explorer, find `index.html` (or any other HTML file like `jobs.html` or `background-verification-form.html`).
    * Right-click on `index.html` and select `Open with Live Server`.
    * Your default web browser will open the TenderStaff website, usually at `http://127.0.0.1:5500/index.html` (the port may vary).

## 💡 Usage

* **Navigate the Website:** Use the header navigation links to explore "Home", "Why Choose Us", "Services", "Job Listings", "Background Verification", and "Contact".
* **Job Listings:** Go to the "Job Listings" page (`jobs.html`) to browse available jobs. This page fetches data from the backend you started. You can use the search bar to find specific jobs.
* **Apply for Jobs:** On the "Job Listings" page, use the "Sign In" or "Register" links in the top right (from the job portal's internal modals) to create an account or log in. Once logged in, you can click "Apply Now" on any job card.
* **Background Verification:** Access the "Background Verification" page (`background-verification-form.html`) from the navigation bar to fill out the detailed form.
* **Admin Panel (Optional):** You can access a simplified admin panel for the job portal by directly navigating to `http://localhost:3000/admin.html` in your browser (assuming your backend is running on port 3000).