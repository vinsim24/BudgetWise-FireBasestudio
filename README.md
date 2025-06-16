# Firebase Studio - BudgetWise App

This is a NextJS starter application called BudgetWise, built in Firebase Studio. It helps you manage your personal finances.

## Getting Started

To get started with exploring or modifying the app, take a look at `src/app/page.tsx` which is the main dashboard page.

## Running Locally

To run this project on your local machine, follow these steps:

1.  **Prerequisites**:
    *   Ensure you have [Node.js](https://nodejs.org/) (which includes npm) installed.
    *   You'll need a Git client to clone the repository if you haven't already.

2.  **Clone the Repository** (if you haven't already):
    ```bash
    git clone <repository_url>
    cd <project-directory>
    ```

3.  **Install Dependencies**:
    Navigate to the project's root directory in your terminal and run:
    ```bash
    npm install
    ```

4.  **Environment Variables**:
    This project might use environment variables (e.g., for API keys for AI features).
    *   Create a file named `.env` in the root of your project.
    *   Add any necessary environment variables to this file. For example, if you plan to use the Genkit AI features:
        ```env
        GOOGLE_API_KEY="YOUR_GOOGLE_AI_API_KEY"
        ```
        Replace `"YOUR_GOOGLE_AI_API_KEY"` with your actual API key.

5.  **Run the Development Servers**:
    You'll typically need to run two separate processes in two different terminal windows/tabs:

    *   **Next.js Application (Frontend)**:
        ```bash
        npm run dev
        ```
        This will start the main web application. By default, it should be accessible at `http://localhost:9002`.

    *   **Genkit AI Flows (Backend for AI)**:
        If you are using or developing AI features (like the initial budget generation), run:
        ```bash
        npm run genkit:dev
        ```
        This starts the Genkit development server and UI, usually accessible at `http://localhost:4000`.

6.  **Access the Application**:
    *   Open your web browser and navigate to `http://localhost:9002` to use the BudgetWise app.
    *   If Genkit is running, you can view and test your AI flows at `http://localhost:4000`.

## Project Structure

*   `src/app/`: Contains the Next.js pages and layouts (using the App Router).
*   `src/components/`: Shared React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/budgetwise/`: Custom components specific to the BudgetWise app.
*   `src/ai/`: Contains Genkit AI flow definitions.
    *   `src/ai/flows/`: Specific AI flow implementations.
*   `src/lib/`: Utility functions, type definitions.
*   `public/`: Static assets.
*   `package.json`: Project dependencies and scripts.

## Available Scripts

In the project directory, you can run several commands:

*   `npm run dev`: Starts the Next.js development server (for the app itself).
*   `npm run genkit:dev`: Starts the Genkit development server for AI flows.
*   `npm run genkit:watch`: Starts the Genkit development server with auto-reloading on file changes.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts a Next.js production server (after building).
*   `npm run lint`: Lints the codebase using Next.js's default ESLint configuration.
*   `npm run typecheck`: Runs TypeScript to check for type errors.
```