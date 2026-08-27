# SkillMatch

> Graph-powered career matching and skill-gap analysis using CognoDB.

SkillMatch is a full-stack web application that analyzes a developer's existing skills, identifies suitable job roles, and highlights missing skills for a selected career path.

The application uses **CognoDB as the graph database** to model and traverse relationships between developers, skills, job roles, and companies.

---

# Screenshots

## Developer Selection & Role Matching

![SkillMatch Role Matching](Screenshot%202026-08-27%20180401.png)

## Skill Gap Analysis

![SkillMatch Skill Gap Analysis](Screenshot%202026-08-27%20180421.png)

## Overview

SkillMatch answers two main questions:

1. Which job roles match a developer's current skills?
2. What skills are missing for a selected target role?

The application represents developers, skills, job roles, and companies as nodes in a graph and uses Cypher queries to traverse their relationships.

### Core Graph

```text
Developer
    |
    | HAS_SKILL
    v
  Skill
    |
    | REQUIRED_FOR
    v
 JobRole
    |
    | HIRED_BY
    v
 Company
```

---

## Features

### Developer Selection

Select a developer whose career profile should be analyzed.

Developer data is retrieved directly from CognoDB.

### Job Role Matching

SkillMatch traverses:

```text
Developer -> Skill -> JobRole
```

and ranks job roles based on the number of matching skills.

### Skill Gap Analysis

For a selected developer and target role, the application compares the developer's current skills with the skills required for the target role.

```text
Current Skills
      +
Required Skills
      |
      v
Skill Gap Analysis
      |
      +---- Current Skills
      |
      +---- Missing Skills
```

### Company Discovery

SkillMatch performs a longer graph traversal:

```text
Developer -> Skill -> JobRole -> Company
```

to discover companies connected to roles that match a developer's skills.

### Responsive UI

The frontend includes:

- Developer selection
- Matching job role cards
- Match indicators
- Skill-gap analysis
- Loading states
- Error handling
- Empty states
- Responsive design

---

# Why a Graph Database?

The core problem in SkillMatch is relationship-driven.

The application needs to answer questions such as:

- Which roles are connected to a developer's skills?
- Which skills are required for a role?
- Which skills is a developer missing?
- Which companies hire for matching roles?

These questions require traversing relationships between multiple entities.

The graph model represents these relationships directly:

```text
Developer -> Skill -> JobRole -> Company
```

This makes multi-hop relationship queries natural to express using Cypher.

A relational database could also represent this information, but the graph model is particularly suitable for the traversal-heavy parts of this application.

---

# Architecture

```text
+--------------------------+
|      React Frontend      |
|       Vite + CSS         |
+------------+-------------+
             |
             | HTTP / REST
             v
+--------------------------+
|     Node.js + Express    |
|        REST API          |
+------------+-------------+
             |
             | Neo4j Driver
             v
+--------------------------+
|         CognoDB          |
|      Graph Database      |
+--------------------------+
```

### Data Flow

```text
React
  |
  | HTTP Request
  v
Express API
  |
  | Cypher Query
  v
CognoDB
  |
  | Graph Results
  v
Express API
  |
  | JSON Response
  v
React UI
```

---

# Graph Data Model

## Nodes

### Developer

Represents a developer profile.

Properties:

```text
id
name
experience
```

Example:

```text
Developer {
    id: "dev1",
    name: "Shreyan Sharma",
    experience: 1
}
```

### Skill

Represents a technical skill.

Properties:

```text
name
```

Examples:

```text
Python
JavaScript
React
Node.js
MongoDB
SQL
Java
Docker
Git
TypeScript
FastAPI
Machine Learning
```

### JobRole

Represents a target career role.

Properties:

```text
title
```

Examples:

```text
Full Stack Developer
Backend Engineer
Frontend Developer
AI Engineer
Software Engineer
DevOps Engineer
```

### Company

Represents a company hiring for one or more job roles.

Properties:

```text
name
```

Examples:

```text
TechNova
CloudWorks
DataSphere
CodeCraft
InnovateLabs
```

---

# Relationships

| Relationship | From | To | Purpose |
|---|---|---|---|
| `HAS_SKILL` | Developer | Skill | Represents skills possessed by a developer |
| `REQUIRED_FOR` | Skill | JobRole | Represents skills required for a job role |
| `HIRED_BY` | JobRole | Company | Represents companies hiring for a role |

Graph representation:

```text
(Developer)-[:HAS_SKILL]->(Skill)

(Skill)-[:REQUIRED_FOR]->(JobRole)

(JobRole)-[:HIRED_BY]->(Company)
```

---

# Graph Traversals

## Developer -> Skill -> JobRole

This traversal identifies suitable job roles based on the developer's existing skills.

```text
Developer
    |
    | HAS_SKILL
    v
  Skill
    |
    | REQUIRED_FOR
    v
 JobRole
```

Example:

```text
Shreyan Sharma
      |
      +---- JavaScript
      +---- React
      +---- Node.js
      +---- MongoDB
                |
                v
       Full Stack Developer
```

---

## Developer -> Skill -> JobRole -> Company

This longer traversal discovers companies connected to a developer's skills through matching job roles.

```text
Developer
    |
    v
  Skill
    |
    v
 JobRole
    |
    v
 Company
```

Example:

```text
Shreyan Sharma
      |
      v
    React
      |
      v
Frontend Developer
      |
      v
  CodeCraft
```

---

# Cypher Queries

## Matching Job Roles

```cypher
MATCH (d:Developer {id: $developerId})
      -[:HAS_SKILL]->
      (s:Skill)
      -[:REQUIRED_FOR]->
      (r:JobRole)

RETURN
  r.title AS role,
  count(DISTINCT s) AS matchedSkills

ORDER BY matchedSkills DESC
```

This query performs:

```text
Developer -> Skill -> JobRole
```

and ranks roles according to matching skills.

The developer ID is passed as a Cypher parameter rather than concatenated directly into the query.

---

## Company Traversal

```cypher
MATCH (d:Developer {id: $developerId})
      -[:HAS_SKILL]->
      (s:Skill)
      -[:REQUIRED_FOR]->
      (r:JobRole)
      -[:HIRED_BY]->
      (c:Company)

RETURN
  c.name AS company,
  r.title AS role,
  count(DISTINCT s) AS matchedSkills

ORDER BY matchedSkills DESC, company
```

This demonstrates the longer traversal:

```text
Developer -> Skill -> JobRole -> Company
```

---

# Skill Gap Analysis

SkillMatch compares a developer's current skills against the skills required for a selected job role.

Example:

```text
Developer:
Shreyan Sharma

Target Role:
Full Stack Developer
```

Result:

```text
Current Skills

✓ JavaScript
✓ React
✓ Node.js
✓ MongoDB


Missing Skills

+ TypeScript
```

The backend performs the comparison using graph data retrieved from CognoDB.

---

# API Reference

## Test Database Connection

```http
GET /api/test
```

Example:

```text
http://localhost:5000/api/test
```

Response:

```json
{
  "success": true,
  "message": "CognoDB connected!"
}
```

---

## Get Developers

```http
GET /api/developers
```

Returns developers stored in CognoDB.

Example response:

```json
{
  "success": true,
  "developers": [
    {
      "id": "dev1",
      "name": "Shreyan Sharma"
    }
  ]
}
```

---

## Get Matching Job Roles

```http
GET /api/developers/:id/roles
```

Example:

```text
http://localhost:5000/api/developers/dev1/roles
```

Returns job roles ranked by the number of matching skills.

Example response:

```json
{
  "success": true,
  "developerId": "dev1",
  "roles": [
    {
      "role": "Full Stack Developer",
      "matchedSkills": 4
    },
    {
      "role": "Backend Engineer",
      "matchedSkills": 3
    }
  ]
}
```

---

## Get Matching Companies

```http
GET /api/developers/:id/companies
```

Example:

```text
http://localhost:5000/api/developers/dev1/companies
```

Returns companies connected through the developer's skills and matching job roles.

---

## Calculate Skill Gap

```http
GET /api/career-gap
```

Query parameters:

```text
developerId
role
```

Example:

```text
http://localhost:5000/api/career-gap?developerId=dev1&role=Full%20Stack%20Developer
```

Example response:

```json
{
  "success": true,
  "developer": "Shreyan Sharma",
  "role": "Full Stack Developer",
  "currentSkills": [
    "JavaScript",
    "React",
    "Node.js",
    "MongoDB"
  ],
  "missingSkills": [
    "TypeScript"
  ]
}
```

---

# Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend development and build tooling |
| JavaScript | Application programming language |
| CSS | UI styling and responsive design |
| Node.js | Backend JavaScript runtime |
| Express | REST API framework |
| CognoDB | Graph database |
| Neo4j JavaScript Driver | Backend connection to CognoDB |
| Cypher | Graph query language |
| CORS | Cross-origin API communication |
| dotenv | Environment variable management |
| Nodemon | Backend development auto-restart |

---

# Project Structure

```text
cognoDB-assessment-2/
│
├── .gitignore
├── README.md
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
└── server/
    ├── .env.example
    ├── server.js
    ├── seed.js
    ├── package.json
    └── package-lock.json
```

> `server/.env` is intentionally excluded from the repository because it contains private CognoDB credentials.

---

# Getting Started

## Prerequisites

Install the following:

- Node.js
- npm
- Git
- CognoDB Cloud instance

---

## 1. Clone the Repository

```bash
git clone https://github.com/shreyan-77/cognoDB-assessment-2.git
cd cognoDB-assessment-2
```

---

## 2. Install Frontend Dependencies

```bash
cd client
npm install
```

---

## 3. Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

---

# Environment Configuration

Inside the `server` directory, create:

```text
.env
```

Add:

```env
COGNODB_URI=your_cognodb_uri
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=your_cognodb_password
PORT=5000
```

A safe template is provided in:

```text
server/.env.example
```

Do not commit the `.env` file.

---

# Seed the Database

From the `server` directory:

```bash
npm run seed
```

The seed script creates the sample graph containing:

- Developers
- Skills
- Job Roles
- Companies
- Relationships between the entities

---

# Run the Backend

From the `server` directory:

```bash
npm run dev
```

The API will run at:

```text
http://localhost:5000
```

---

# Run the Frontend

From the `client` directory:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

Open the URL displayed by Vite in your browser.

---

# Available Scripts

## Frontend

Start development server:

```bash
npm run dev
```

---

## Backend

Start development server with Nodemon:

```bash
npm run dev
```

Start backend normally:

```bash
npm start
```

Seed the CognoDB database:

```bash
npm run seed
```

---

# Security

Database credentials are stored using environment variables.

Actual credentials are not included in the repository.

The following file should remain local:

```text
server/.env
```

The repository contains:

```text
server/.env.example
```

with placeholder values only.

---

# Design Decisions

## Graph-Oriented Data Model

The application's core functionality depends on relationships between developers, skills, roles, and companies.

The graph model makes these relationships explicit and allows direct traversal between connected entities.

## Parameterized Cypher

User-provided identifiers are passed as parameters:

```javascript
{
  developerId: req.params.id
}
```

instead of constructing Cypher queries through string concatenation.

## Server-Side Database Access

The React frontend does not connect directly to CognoDB.

The architecture is:

```text
React -> Express -> CognoDB
```

This keeps database credentials and database operations on the backend.

## Small Seed Dataset

The project uses a compact but interconnected dataset to demonstrate the graph model, traversal queries, and application functionality without unnecessary complexity.

---

# Assessment Highlights

The project demonstrates:

- Graph data modeling
- Nodes with meaningful properties
- Typed graph relationships
- Seed data generation
- Parameterized Cypher queries
- Multi-hop graph traversal
- REST API development
- React frontend integration
- Loading states
- Error handling
- Skill-gap analysis
- Database-backed developer selection
- Company discovery through graph traversal

---

# Future Improvements

Possible extensions include:

- Developer profile creation
- Authentication
- Skill management
- More advanced role recommendations
- Skill importance weighting
- Company filtering
- Learning-resource recommendations
- Interactive graph visualization
- Larger graph datasets
- Production deployment

These features are outside the scope of the current MVP.

---

# Author

**Shreyan Sharma**

GitHub:  
https://github.com/shreyan-77

Repository:  
https://github.com/shreyan-77/cognoDB-assessment-2
