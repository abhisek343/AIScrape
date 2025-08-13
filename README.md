# AIScrape 🚀

AIScrape is a powerful, intuitive platform that simplifies web scraping by enabling you to build, manage, and scale complex data extraction workflows with ease.

## ✨ Features

- **Visual Workflow Builder:** Drag-and-drop interface to create complex scraping logic without writing code.
- **Rich Node Library:** 25+ nodes including navigation, inputs, extraction, HTTP calls, screenshots, regex, infinite scroll, waits, and more.
- **AI Assistant (Chatbot):** Context-aware guidance for building flows. Supports an optional Automation Mode that can create, update, and run workflows from a strict JSON spec.
- **AI-Powered Data Extraction:** Use AI to extract structured data from text/HTML.
- **Advanced Browser Controls:** Set viewport, user agent, cookies, localStorage; hover and type; wait for navigation or network idle.
- **HTTP Requests:** Call external APIs directly within workflows.
- **Scheduled Executions:** Set up cron jobs to run your workflows at regular intervals.
- **Secure Credential Management:** Safely store and use credentials for sites and providers.
- **Real-time Monitoring:** Track the progress and results of workflow executions.
- **Data Delivery:** Send extracted data to your systems via webhooks.

## 🛠️ Tech Stack

- **Next.js** – ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
- **TypeScript** – ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
- **Tailwind CSS** – ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
- **Prisma** – ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
- **Stripe** – ![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white)
- **React Flow** – ![React Flow](https://img.shields.io/badge/React_Flow-1A192B?style=for-the-badge&logo=react&logoColor=61DAFB)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/abhisek343/AIScrape.git
    cd AIScrape
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables. You can use `.env.example` as a template.

     Required for the chatbot assistant:
     - `GOOGLE_API_KEY` — for Generative AI (Gemini) features used by the in-app chatbot.
     - `GEMINI_ENABLE_GOOGLE_SEARCH` — set to `true` to enable Google Search Grounding for up-to-date web answers.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧩 Supported Workflow Nodes

Grouped highlights of currently available nodes (see in-app Task Menu for full details):

- **Browser & Navigation**
  - `LAUNCH_BROWSER`, `NAVIGATE_URL`, `SCROLL_TO_ELEMENT`, `WAIT_FOR_NAVIGATION`, `WAIT_FOR_NETWORK_IDLE`, `INFINITE_SCROLL`
- **Interaction**
  - `CLICK_ELEMENT`, `FILL_INPUT`, `HOVER_ELEMENT`, `KEYBOARD_TYPE`
- **Extraction**
  - `PAGE_TO_HTML`, `EXTRACT_TEXT_FROM_ELEMENT`, `EXTRACT_ATTRIBUTES`, `EXTRACT_LIST`, `REGEX_EXTRACT`, `SCREENSHOT`
- **Data & Integrations**
  - `EXTRACT_DATA_WITH_AI`, `HTTP_REQUEST`, `DELIVER_VIA_WEBHOOK`
- **JSON Utilities**
  - `READ_PROPERTY_FROM_JSON`, `ADD_PROPERTY_TO_JSON`
- **Environment Controls**
  - `SET_VIEWPORT`, `SET_USER_AGENT`, `SET_COOKIES`, `SET_LOCAL_STORAGE`
- **Timing**
  - `WAIT_FOR_ELEMENT`, `DELAY`

Each node documents its required inputs and outputs in the editor. Credits (where applicable) are shown in the UI.

## 💬 Chatbot Assistant and Automation Mode

- **Context-aware helper:** The chatbot can inspect the currently open workflow to explain steps and suggest improvements. It also generates Mermaid diagrams to visualize suggested flows.
- **Automation Mode (optional):** If you explicitly ask to automate/create/update a workflow, the chatbot can output a strict JSON object that the app will parse to create/update and optionally run a workflow.

Automation is off by default. To automate, explicitly say something like "automation on", "automate", "create a workflow", or "update the workflow". Otherwise, the chatbot will only provide guidance and diagrams without executing anything.

Automation JSON shape (example):

```json
{
  "action": "CREATE_AND_RUN",
  "workflow": {
    "name": "My Example Flow",
    "description": "Navigate and capture page HTML",
    "nodes": [
      { "key": "A", "type": "LAUNCH_BROWSER", "inputs": { "Website Url": "https://example.com" } },
      { "key": "B", "type": "PAGE_TO_HTML" }
    ],
    "edges": [
      { "from": { "node": "A", "output": "Web page" }, "to": { "node": "B", "input": "Web page" } }
    ]
  }
}
```

Notes:
- Types must match node names exactly (see Supported Workflow Nodes).
- Inputs must match the node’s input names exactly.
- For `UPDATE_ONLY` and `UPDATE_AND_RUN`, the currently open workflow is the update target and you should omit the name.

### Slash commands (experimental)

- You can trigger quick, smooth auto-creation directly from the chat input using slash-style commands.
- Example: `/ extract image from wikipedia page chicken`
  - Creates a 3-node flow: `LAUNCH_BROWSER` → `PAGE_TO_HTML` → `EXTRACT_ATTRIBUTES` (img/src), auto-connects, and starts a run.
  - The editor refreshes so you see nodes connected with inputs prefilled.
  - Endpoint: `POST /api/workflows/slash` with `{ command }`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
