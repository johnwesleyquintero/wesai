# WesAI Code Assistant

Your AI-powered pair programmer and creative assistant.

WesAI Code Assistant is a product of [ScaleSmart](https://wescode.vercel.app/). It is a client-side web application that leverages the Google Gemini API (for text-based tasks) and Imagen API (for image generation) to provide intelligent code analysis, refactoring suggestions, component explanations, code generation, general content creation, image generation, and an interactive chat mode, with a special focus on TypeScript and React development.

![WesAI Code Assistant Screenshot](https://github.com/user-attachments/assets/df9ed07b-9e5d-416b-af24-c63e3f4be11a)

**Note:** You can also view this documentation directly within the WesAI application under the "Documentation" tab.

## Key Features

- **Login Page:** Provides a basic client-side login to protect API key usage.
- **API Key Management:** Allows secure saving and removal of your Gemini API key using browser local storage, including confirmation before key removal to prevent accidental data loss.
- **Light/Dark Mode Toggle:** Enables switching between light and dark themes for comfortable viewing, with preference saved.
- **Code Review:** Offers detailed feedback on your code, covering:
  - Potential bugs and logic errors
  - Clarity, readability, and maintainability
  - Performance optimizations (React-specific)
  - Adherence to TypeScript & React best practices
  - Security vulnerabilities
- **Code Refactor:** Provides AI-generated refactoring suggestions, including:
  - A summary of improvements
  - The full refactored code
  - Focus on modernizing syntax and improving TypeScript/React patterns.
- **Component Preview (Textual):** Generates a textual description of your React components, covering:
  - Purpose and visual structure
  - Expected props and their roles
  - Internal state and behavior
  - User interactivity
- **Code Generation:** Generates code based on your description (e.g., a React component, a TypeScript function).
- **Content Creation:** Creates various types of written content based on your description (e.g., blog posts, social media updates, documentation sections, email copy).
- **Image Generation:** Generates images based on your description using Google's Imagen model, with a download option.
- **Interactive Chat Mode:**
  - Ask follow-up questions about reviews, refactors, previews, or generated code/content.
  - Get general coding assistance for TypeScript and React.
  - Live preview for React components generated in chat.
- **In-App Documentation:** Allows viewing this README directly within the application for easy reference.
- **Sleek UI:** Features a modern, responsive interface built with Tailwind CSS, with theme support and convenient "clear input" buttons.

## Technology Stack

- **Frontend:** React, TypeScript.
- **Styling:** Tailwind CSS (with class-based Dark Mode).
- **AI:** Google Gemini API (`gemini-2.5-flash-preview-04-17` for text tasks, `imagen-3.0-generate-002` for image generation).
- **Build Tool:** Vite.
- **Modules:** Loaded via ES Modules and `esm.sh` for CDN access in development, bundled by Vite for production.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari).
- A **Google Gemini API Key**. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey). Ensure this key is enabled for both the Gemini API and the Imagen API (often covered by "Generative Language API" or similar in Google Cloud Console if using project-based keys).

### Running Locally (Using Vite Dev Server - Recommended)

1.  **Download/Clone:** Ensure all project files and folders are in a single project directory.
2.  **Install Dependencies:** You'll need Node.js and npm (or yarn).
    ```bash
    # Using npm
    npm install
    # Or using yarn
    yarn install
    ```
3.  **Set up Environment Variable (Optional but Recommended for Dev):**
    - Create a file named `.env` in the root of your project.
    - Add your Gemini API key to this file:
      ```env
      VITE_GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY
      ```
    - **IMPORTANT:** Do not commit your `.env` file or real API keys to version control. The `.gitignore` file (if you create one) should include `.env`.
4.  **Run the Development Server:**
    ```bash
    # Using npm
    npm run dev
    # Or using yarn
    yarn dev
    ```
    This will typically start the server on `http://localhost:5173` (or another port if 5173 is busy).
5.  **Login:**
    - When you first open the application, you will be prompted to log in.
    - The password is: **`wesai_rocks`**
    - _(Note: This is a hardcoded password for local/personal use to protect API key access and is not secure for production environments.)_
6.  **API Key Setup (if not using `.env` or to override):**
    - After logging in, you'll see the "Manage Gemini API Key" section.
    - If you didn't set the `VITE_GEMINI_API_KEY` or wish to use a different key, enter your Gemini API Key into the input field.
    - Click "Save Key." The key will be stored in your browser's local storage for future sessions and will take precedence over the environment variable.
    - **Security Note:** Storing API keys in browser local storage is convenient for client-side tools but can be a security risk if the site is vulnerable to XSS attacks. For production applications with multiple users, API keys should ideally be managed on a secure backend server.

## How to Use

1.  **Login** to the application.
2.  **Set your API Key** if it's not already configured (either via `.env` or the UI).
3.  **Toggle Theme (Optional):** Use the sun/moon icon in the header to switch between light and dark modes.
4.  **Select a Tab:**
    - **Review:** Paste your TypeScript/React code into the input area and click "Review Code."
    - **Refactor:** Paste your code and click "Refactor Code." You'll receive a summary and the refactored code.
    - **Preview:** Paste React component code and click "Get Component Preview" for a textual description.
    - **Generate:** Describe the code you want and click "Generate Code."
    - **Content:** Describe the written content you need (e.g., blog post idea, tweet, email draft) and click "Create Content."
    - **Image:** Type a description of the image you want (a "prompt") and click "Generate Image." You can then download the result.
    - **Chat:** Click the "Chat" tab. Ask questions related to code, TypeScript, React, or previous AI outputs. Component code in chat can be previewed live.
    - **Documentation:** Click the "Documentation" tab to view this README file.
5.  **View Results:** Feedback, refactored code, previews, generated code/content/images, and chat responses will appear.
6.  **Copy Output:** Use the copy buttons on feedback panels or chat messages.
7.  **Clear Inputs:** Use the "X" icon next to input fields to quickly clear them.
8.  **Logout:** Click the "Logout" button in the API key management section. This will also clear any API key set via the UI.

## Building for Production

1.  **Install Dependencies** (if not already done):
    ```bash
    npm install
    # or
    yarn install
    ```
2.  **Run the Build Script:**
    ```bash
    npm run build
    # or
    yarn build
    ```
    This will create a `dist` folder with optimized, static assets.
3.  **Preview Production Build (Optional):**
    ```bash
    npm run preview
    # or
    yarn preview
    ```
4.  **Serve from `dist`:** Deploy the contents of the `dist` folder to any static site hosting service. Ensure your hosting service correctly serves `index.html` for all route paths if you implement client-side routing beyond the hash. (Currently, this app doesn't use complex routing).

## Deployment

WesAI Code Assistant can be deployed as a static web application.

1.  Run the build script: `npm run build` (or `yarn build`).
2.  Deploy the contents of the generated `dist` folder to any platform that supports static site hosting, such as:
    _ Vercel
    _ Netlify
    _ GitHub Pages
    _ Cloudflare Pages \* Firebase Hosting
    Ensure `README.md` is in the `public` folder (Vite default) or configured to be copied to the `dist` folder so it can be fetched by the Documentation tab. (In the current setup, Vite will copy files from `public` to `dist` root).

## Future Ideas

- Visual diff view for refactored code.
- Option to select specific focus areas for review/refactoring/generation.
- More advanced chat context retention and history management.
- VS Code Extension.
- Support for uploading files directly for review/refactor.

## Limitations

- The React app preview feature in the chat interface is currently not working as expected. Our team is actively reviewing this bug.

## Repository

- GitHub: [https://github.com/johnwesleyquintero/wesai](https://github.com/johnwesleyquintero/wesai).

## Acknowledgements

- Powered by the Google Gemini and Imagen APIs.
- Built with TypeScript and React.
- Styled with Tailwind CSS.
- Development and bundling with Vite.

## Privacy Policy

Your privacy is important to us. This section outlines how WesAI Code Assistant handles your data.

- **API Keys:** Gemini API keys are stored locally in your browser's local storage. They are never transmitted to our servers or any third party. You have full control to save or remove your key at any time.
- **Code and Content:** Any code, text, or image prompts you input into the application are sent directly to the Google Gemini API for processing. We do not store, log, or review this data on our end. Google's data usage policies apply to the API interactions.
- **Local Storage:** Beyond your API key, your theme preference (light/dark mode) is also stored in local storage for convenience.
- **No Analytics:** WesAI Code Assistant does not use any third-party analytics, cookies, or tracking technologies.

## Terms of Service

By using WesAI Code Assistant, you agree to the following terms:

- **API Key Usage:** You are responsible for obtaining and managing your own Google Gemini API key. Your use of the Gemini API is subject to Google's Terms of Service.
- **No Warranty:** WesAI Code Assistant is provided "as is" without any warranty, express or implied. We do not guarantee the accuracy, completeness, or usefulness of any AI-generated content or code.
- **Limitation of Liability:** We shall not be liable for any damages arising from the use or inability to use this application.
- **Educational and Personal Use:** This application is intended for educational and personal use. It is not designed for critical or production environments.
- **Modifications:** We reserve the right to modify or discontinue the application at any time without notice.

## License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 John Wesley Quintero

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

For any questions regarding privacy or terms, please refer to the Google Gemini API documentation or contact us via the GitHub repository.

**Happy Coding and Creating with WesAI!**
