# Headline Hub

This is a Next.js application built with Firebase Studio for managing and displaying headlines efficiently. It features multi-language support (English/Arabic), customizable display settings, category management, and data export capabilities.

## Features

*   **Headline Management:** Create, Read, Update, Delete (CRUD) headlines.
*   **Categorization:** Assign headlines to customizable categories.
*   **Filtering & Searching:** Filter headlines by state or category, and search by title/subtitle.
*   **Customization:**
    *   Light/Dark themes.
    *   Adjustable font size and selection.
    *   Custom background/foreground colors (HSL).
*   **Internationalization:** Full UI translation (English/Arabic) with RTL support.
*   **Data Export:** Export headlines to CSV or TXT format based on user settings.
*   **Responsive Design:** Adapts to various screen sizes (mobile, tablet, desktop).
*   **Persistence:** Settings and data are saved locally.

## Getting Started

### Prerequisites

*   Node.js (version 18 or later recommended)
*   npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up environment variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env.local
        ```
    *   Edit `.env.local` and add your Google Generative AI API key:
        ```
        GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_API_KEY_HERE
        ```
        *(Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey))*

### Running the Development Server

Start the Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at [http://localhost:9002](http://localhost:9002) (or the specified port).

### Building for Production

Create a production-ready build:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Starting the Production Server

Run the production build:

```bash
npm run start
# or
yarn start
# or
pnpm start
```

## Deployment

This Next.js application is ready for deployment on various platforms.

### Vercel

[Vercel](https://vercel.com) is the recommended platform for deploying Next.js applications.

1.  Push your code to a GitHub repository.
2.  Sign up or log in to Vercel.
3.  Import your GitHub repository into Vercel.
4.  Configure environment variables (like `GOOGLE_GENAI_API_KEY`) in the Vercel project settings.
5.  Deploy! Vercel will automatically build and deploy your application.

### Other Platforms

You can also deploy to other platforms like Netlify, AWS Amplify, Google Cloud Run, or your own server. Refer to the specific platform's documentation for deploying Next.js applications. Ensure you set up the necessary environment variables on your chosen platform.

## Linting and Type Checking

*   **Linting:**
    ```bash
    npm run lint
    ```
*   **Type Checking:**
    ```bash
    npm run typecheck
    ```
