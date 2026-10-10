![TrophyD Banner Collage](https://i.ibb.co/mVT86gB4/imagen-2026-06-02-181001503.png)

# 🏆 TrophyD: The Completionist Social Network

<p align="center">
  <a href="https://trophyd.vercel.app" target="_blank"><img src="https://img.shields.io/badge/Launch_App-Live_Demo-FF4500?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Framework-Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
</p>

---

## What is TrophyD?

**TrophyD** is a web platform that merges activity tracking concepts (similar to *Letterboxd*) with guide and completionist mechanics (like *Steam* or *PSNProfiles*). Built on a Serverless architecture and powered by the Next.js App Router, it provides a seamless and immersive experience.

The core of TrophyD is not just tracking what you play, but **building the ultimate collaborative library** for the completionist community through an immersive user experience.

### Key Features

<details>
  <summary><strong>🎮 Immersive 3D Experience</strong></summary>
  <br>
  Interactive visual representation through 3D cards rendered directly in the browser using React Three Fiber (WebGL), simulating original game hardware (PS5, N64, GameBoy, Switch, etc.).
  <br><br>
  <img src="https://github.com/user-attachments/assets/08f8d2b3-d378-41f0-8a23-3aed45a8dba0" alt="3D Interactive Cards" width="100%">
</details>

<details>
  <summary><strong>👥 Social Interaction</strong></summary>
  <br>
  Log your 100% completed games, rate titles, and build a network of followers and following.
  <br><br>
  <img src="https://github.com/user-attachments/assets/2bfa9d14-5e51-4d3b-967e-f2f8dc0a5859" alt="Social Interaction" width="100%">
</details>

<details>
  <summary><strong>🤝 Collaboration</strong></summary>
  <br>
  Write and share detailed guides and checklists to help other trophy hunters in their playthroughs.
  <br><br>
  <img src="https://github.com/user-attachments/assets/710e2d54-599e-42c2-899e-278e137acbc5" alt="Guide Creation" width="100%">
</details>

---

## Core Pillars & Architecture

The primary goal is to deliver an ultra-fast, scalable, and visually stunning platform. The system is evaluated and built upon:

| Pillar | Key Technology | Purpose |
| :--- | :--- | :--- |
| **Scalability** | `Supabase` & `PostgreSQL` | Ensure robust, real-time user management and relational databases. |
| **Web Immersion** | `Three.js` & `React Three Fiber` | Render `.glb` models of classic and modern consoles without performance penalties. |
| **Data Accuracy** | `IGDB API (Twitch)` | Ensure reliable metadata, cover art, and technical details for any video game. |

### Tech Stack
*   **Frontend:** Next.js (App Router), React, Tailwind CSS.
*   **Backend & Auth:** Supabase (BaaS).
*   **3D Graphics:** React Three Fiber, Drei.
*   **UI Components:** shadcn/ui (Radix Primitives).
*   **Integrations:** IGDB API.

## Project Structure

*   `/app`: Main application routing. Contains auth modules (`/login`, `/register`), user profiles (`/profile/[nickname]`), search, and API integration (`/api/igdb`).
*   `/components`: Reusable UI components (based on shadcn) and complex frontend logic, highlighting the 3D model viewer (`gameCard3D.tsx`).
*   `/lib`: Supabase client initialization logic and app utilities.
*   `/public/models`: Static directory storing 3D models (`.glb`) and textures for over 15 different platforms and consoles used in the platform.

---

## Environment Setup

> ❗**Note:** If you just want to browse and use the app, please use the [Live Demo](https://trophyd.vercel.app) (currently offline!). The following instructions are strictly for developers looking to run the project locally or contribute.

The following instructions are for developers looking to contribute).*
The project is ready to run in local Node.js environments. Active Supabase and IGDB credentials are required.

```bash
# Clone the repository
git clone https://github.com/davidvilaa/trophyd.git
cd trophyd

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

```

Make sure to fill the `.env.local` file with the following keys:
* `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET`

## Running the Development Server

The system features a development server powered by Turbo (Next.js) that compiles routes and 3D models on demand.

```bash
# Start the development server on localhost:3000
npm run dev
```
