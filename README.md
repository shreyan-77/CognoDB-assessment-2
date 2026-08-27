# SkillMatch

A graph-powered career matching application built with React, Node.js, Express, and CognoDB.

SkillMatch analyzes a developer's existing skills and identifies suitable job roles and skill gaps using graph relationships.

---

## Overview

SkillMatch answers two simple questions:

1. Which job roles match a developer's current skills?
2. What skills are missing for a selected target role?

The application uses CognoDB as the graph database and queries relationships between developers, skills, job roles, and companies.

---

## Why a Graph Database?

The core problem is relationship-based.

SkillMatch needs to traverse relationships such as:

Developer → Skill → Job Role

and:

Developer → Skill → Job Role → Company

These relationships can become cumbersome to represent using multiple relational tables and JOINs.

With a graph database, these relationships are directly represented as nodes and relationships, making traversal-based queries natural.

The application does not assume graph databases are always better than relational databases. The graph model is useful here because the main questions depend on connected entities and multi-hop traversal.

---

## Architecture

```text
┌──────────────────────┐
│      React UI        │
│      Vite + CSS      │
└──────────┬───────────┘
           │ HTTP
           ↓
┌──────────────────────┐
│   Express API        │
│      Node.js         │
└──────────┬───────────┘
           │
           │ Neo4j Driver
           ↓
┌──────────────────────┐
│      CognoDB         │
│    Graph Database    │
└──────────────────────┘