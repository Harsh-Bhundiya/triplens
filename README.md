# 🌍 Triplens — Collaborative Travel Planning & Expense SaaS

Triplens is a modern, collaborative travel management platform built with **Next.js 15**, **MongoDB**, and **Leaflet Maps**. It allows travel groups to plan trips, shortlist and vote on hotels, map multi-day itineraries, and settle group expenses using an algorithmic debt-clearing engine.

---

## 🚀 Key Features

* **🗺️ Interactive Map & Route Engine:** Visualizes destinations and itineraries using Leaflet & OpenStreetMap with dynamic multi-stop route plotting.
* **🏨 Hotel Shortlisting & Community Voting:** Group members can add hotels and upvote/downvote options in real time.
* **👥 Collaborative Trip Invites:** Instant 6-digit trip share codes allowing friends to join group itineraries seamlessly.
* **💸 Splitwise-Style Expense Engine:** 
  * Tracks group expenses across categories (Food, Transport, Stay, Activities).
  * Implements an optimized **Greedy Two-Pointer Debt Settlement Algorithm** to minimize the total number of transactions needed to settle all debts.
* **🔐 Secure Authentication:** NextAuth session-based authentication protecting user trips and data.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS / Custom CSS
* **Backend:** Next.js Server Route Handlers, MongoDB, Mongoose ODM
* **Mapping:** Leaflet, React-Leaflet, OSRM Routing API
* **Auth:** NextAuth.js
* **Deployment:** Vercel

---

## ⚙️ Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Harsh-Bhundiya/triplens.git
   cd triplens