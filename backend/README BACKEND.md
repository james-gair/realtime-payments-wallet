# Express Backend Structure: handlers, routes, and createapp

This document explains the purpose and responsibilities of the main parts of an Express backend project: **handlers**, **routes**, and **createapp**.

---

## 1. handlers/

- Contains the core **logic** for the backend.
- Handles reading from and writing to the database (PostgreSQL).
- Place any validation, data checks, and processing here.

---

## 2. routes/

- Defines the API **routes** (endpoints) exposed by the backend.
- Maps HTTP methods and URL paths to corresponding handler functions.
- Organizes routes by feature type (user, posts, products).

---

## 3. createapp.ts

- Sets up the **Express application instance**.
- Configures middleware such as JSON body parsing, CORS, logging, etc.
- Mounts route groups defined in the `routes/` directory onto specific URL prefixes.

---