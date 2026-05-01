# Letterstorm - AI Typing Game & WPM Test

![Letterstorm](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-19.0-blue)
![Vite](https://img.shields.io/badge/Vite-6.0-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC)

**Letterstorm** is a cyberpunk-themed, high-octane **typing game** and **words-per-minute (WPM) test** designed for the browser. Whether you are looking for **touch typing practice**, a gamified **typing speed test**, or an open-source **React browser game**, Letterstorm challenges players to improve their reaction times by typing words to destroy incoming threats before they breach the system. 

The application is built using React, Vite, and TailwindCSS to provide an ultra-smooth, retro-futuristic arcade experience directly on the web.

## 🚀 Features

- **Dynamic Difficulty:** Word difficulty and spawn rates increase procedurally as waves progress.
- **Particle & Combat Effects:** Action-packed visual feedback (lasers, explosions, UI wobble) created using canvas-free DOM rendering and `motion/react`.
- **Integrated Audio Engine:** Web Audio API sound effects (lasers, explosions, low-end hums) dynamically generated at runtime without external audio assets.
- **Combo System & Modifiers:** Sustained typing accuracy activates combos and multiplier score bonuses.
- **Responsive "Retro Arcade" UI:** Tailored layout for both desktop and mobile views, prioritizing a dark mode, neon-green (emerald) CRT aesthetic.

## 🛠️ Architecture Overview

The game loop is driven by a `requestAnimationFrame` hook instead of standard React state intervals. This separates the logic update cycle from React's render cycle, dramatically improving performance for moving entities (words/enemies, particles, and projectiles).

For an in-depth dive into the state management, graphics, and audio synthesis, please refer to [ARCHITECTURE.md](ARCHITECTURE.md).

## 💻 Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS + custom keyframe animations
- **Animations:** Motion (formerly Framer Motion)
- **Icons:** Lucide React

## 🏃‍♂️ Getting Started (Local Development)

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd letterstorm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

## ☁️ Deployment (Google Cloud Run)

This repository comes pre-configured with a `Dockerfile` and `nginx.conf` optimized for a stateless container deployment on **Google Cloud Run**. The multistage Dockerfile builds the static React bundle using Node, and then serves it via a lightweight Nginx web server.

### Option 1: Deploy from Source (Cloud SDK)

If you have the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed, you can deploy directly from your source tree. Cloud Run will automatically build the container and deploy it.

```bash
# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Deploy directly to Cloud Run
gcloud run deploy letterstorm \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

### Option 2: Build & Push Container Manually

Alternatively, you can build the container locally and push it to Artifact Registry:

```bash
# 1. Build the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/letterstorm:latest .

# 2. Push the image to your container registry
docker push gcr.io/YOUR_PROJECT_ID/letterstorm:latest

# 3. Deploy the image to Cloud Run
gcloud run deploy letterstorm \
  --image gcr.io/YOUR_PROJECT_ID/letterstorm:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

> **Note:** The Nginx server in the provided container is configured to bind to port `8080` (the standard entry port for Cloud Run containers) and seamlessly handles Single Page Application (SPA) routing.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Usama Ali**
- LinkedIn: [linkedin.com/in/usamaalipk](https://www.linkedin.com/in/usamaalipk)
- Contact: usamaaliarofficial@gmail.com
