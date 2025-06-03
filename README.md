
# WesAI Code Assistant 🤖✨

**Your AI-powered pair programmer for TypeScript & React, built by brothers in code!**

WesAI Code Assistant is a client-side web application that leverages the Google Gemini API to provide intelligent code analysis, refactoring suggestions, component explanations, code generation, and an interactive chat mode, with a special focus on TypeScript and React development. This tool was forged in a fun, collaborative spirit – think of it as your AI dev bro!

**Note:** You can also view this documentation directly within the WesAI application under the "Documentation" tab!

## ✨ Key Features

*   **🔐 Login Page:** Basic client-side login to protect API key usage.
*   🔑 **API Key Management:** Securely save and remove your Gemini API key using browser local storage.
*   🌞 **Light/Dark Mode Toggle:** Switch between light and dark themes for comfortable viewing. Your preference is saved!
*   🧐 **Code Review:** Get detailed feedback on your code regarding:
    *   Potential bugs and logic errors
    *   Clarity, readability, and maintainability
    *   Performance optimizations (React-specific)
    *   Adherence to TypeScript & React best practices
    *   Security vulnerabilities
*   💅 **Code Refactor:** Receive AI-generated refactoring suggestions, including:
    *   A summary of improvements
    *   The full refactored code
    *   Focus on modernizing syntax and improving TypeScript/React patterns.
*   📄 **Component Preview (Textual):** Get a textual description of your React components, covering:
    *   Purpose and visual structure
    *   Expected props and their roles
    *   Internal state and behavior
    *   User interactivity
*   💻 **Code Generation:** Describe the code you need (e.g., a React component, a TypeScript function), and WesAI will generate it for you.
*   💬 **Interactive Chat Mode:**
    *   Ask follow-up questions about reviews, refactors, previews, or generated code.
    *   Get general coding assistance for TypeScript and React.
    *   Powered by Gemini's chat capabilities (your other AI bro!).
*   📖 **In-App Documentation:** View this README directly within the application for easy reference.
*   💅 **Sleek UI:** Modern, responsive interface built with Tailwind CSS, now with theme support.

## 🛠️ Technology Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS (with class-based Dark Mode)
*   **AI:** Google Gemini API (`gemini-2.5-flash-preview-04-17`)
*   **Modules:** Loaded via ES Modules & `esm.sh` (no build step required for basic use)

## 🚀 Getting Started

### Prerequisites

*   A modern web browser (Chrome, Firefox, Edge, Safari).
*   A **Google Gemini API Key**. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running Locally

1.  **Download/Clone:** Ensure all project files and folders (`index.html`, `index.tsx`, `App.tsx`, `LoginPage.tsx`, `metadata.json`, `README.md`, `components/`, `services/`) are in a single project directory.
2.  **Serve `index.html`:** Since this is a client-side application without a build step, you need to serve `index.html` via an HTTP server.
    *   **Using VS Code Live Server:** If you use VS Code, the "Live Server" extension is a great option. Right-click `index.html` and select "Open with Live Server."
    *   **Using Python:** If you have Python installed, navigate to the project directory in your terminal and run:
        ```bash
        python -m http.server
        ```
        Then open `http://localhost:8000` (or the port shown) in your browser.
    *   **Other HTTP Servers:** Any simple static file server will work.
3.  **Login:**
    *   When you first open the application, you will be prompted to log in.
    *   The password is: **`wesai_rocks`**
    *   *(Note: This is a hardcoded password for local/personal use to protect API key access and is not secure for production environments.)*
4.  **API Key Setup:**
    *   After logging in, you'll see the "Manage Gemini API Key" section.
    *   Enter your Gemini API Key into the input field.
    *   Click "Save Key." The key will be stored in your browser's local storage for future sessions.
    *   **Security Note:** Storing API keys in browser local storage is convenient for client-side tools but can be a security risk if the site is vulnerable to XSS attacks. For production applications with multiple users, API keys should ideally be managed on a secure backend server.

### (Optional) Local Development - Using `process.env.API_KEY`

For quick local testing, if you wish to temporarily use an API key without UI input:
1.  Open `index.html`.
2.  Find the commented-out line within the first `<script>` tag:
    ```html
    // window.process = { env: { API_KEY: 'YOUR_GEMINI_API_KEY' } };
    ```
3.  Uncomment it and replace `YOUR_GEMINI_API_KEY` with your actual key.
**IMPORTANT:** Do NOT commit your real API key to version control if you use this method. This is only for transient local development. The UI method is preferred.

## 💡 How to Use

1.  **Login** to the application.
2.  **Set your API Key** if you haven't already.
3.  **Toggle Theme (Optional):** Use the sun/moon icon in the header to switch between light and dark modes.
4.  **Select a Tab:**
    *   **Review:** Paste your TypeScript/React code into the input area and click "Review Code." The AI will provide detailed feedback.
    *   **Refactor:** Paste your code and click "Refactor Code." You'll receive a summary of changes and the fully refactored code.
    *   **Preview:** Paste a React component's code and click "Get Component Preview" to get a textual description of its functionality, props, state, and behavior.
    *   **Generate:** Enter a description of the code you want (e.g., "a React functional component for a simple counter with increment and decrement buttons") in the input area and click "Generate Code." The AI will attempt to generate the code for you.
    *   **Chat:** Click the "Chat" tab. An AI chat session will start. Type your questions related to code, TypeScript, React, or previous AI outputs into the input field and click "Send."
    *   **Documentation:** Click the "Documentation" tab to view this README file.
5.  **View Results:** Feedback, refactored code, previews, generated code, and chat responses will appear in the display area.
6.  **Copy Feedback:** Use the copy button on feedback panels to easily copy the AI's output.
7.  **Logout:** Click the "Logout" button in the API key management section to end your session.

## 🖼️ Screenshots

*(This is a great place to add screenshots of WesAI Code Assistant in action!)*

*   *Login Page*
*   *API Key Management*
*   *Light/Dark Mode Toggle*
*   *Code Review Tab with Feedback*
*   *Code Refactor Tab with Results*
*   *Component Preview Tab*
*   *Code Generation Tab*
*   *Chat Tab Interface*
*   *Documentation Tab*

## ☁️ Deployment

WesAI Code Assistant is a static web application. You can deploy it to any platform that supports static site hosting, such as:

*   [Vercel](https://vercel.com/)
*   [Netlify](https://www.netlify.com/)
*   [GitHub Pages](https://pages.github.com/)
*   [Cloudflare Pages](https://pages.cloudflare.com/)
*   [Firebase Hosting](https://firebase.google.com/docs/hosting)

Simply upload the project files to your chosen hosting provider. Ensure `README.md` is in the root of your deployment so it can be fetched by the Documentation tab.

## 🔮 Future Ideas

*   Visual diff view for refactored code.
*   Option to select specific focus areas for review/refactoring/generation.
*   More advanced chat context retention.
*   VS Code Extension!

## 🙏 Acknowledgements

*   Powered by the **Google Gemini API** (Shoutout to our AI Bro Gemini!).
*   Built with love, TypeScript, and React by a couple of dev brothers.
*   Styled with Tailwind CSS.

---

Happy Coding with WesAI! 🚀
