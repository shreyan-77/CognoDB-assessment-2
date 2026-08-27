import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import neo4j from "neo4j-driver";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(
    process.env.COGNODB_USERNAME,
    process.env.COGNODB_PASSWORD
  )
);

// --------------------------------------------------
// Test CognoDB connection
// --------------------------------------------------

app.get("/api/test", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(
      "RETURN 'CognoDB connected!' AS message"
    );

    res.json({
      success: true,
      message: result.records[0].get("message")
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  } finally {
    await session.close();
  }
});

// --------------------------------------------------
// Get all developers
// --------------------------------------------------

app.get("/api/developers", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (d:Developer)
      RETURN d.id AS id, d.name AS name
      ORDER BY d.name
    `);

    const developers = result.records.map((record) => ({
      id: record.get("id"),
      name: record.get("name")
    }));

    res.json({
      success: true,
      developers
    });
  } catch (error) {
    console.error("Developers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load developers"
    });
  } finally {
    await session.close();
  }
});

// --------------------------------------------------
// Find matching job roles for a developer
// Developer -> Skill -> JobRole
// --------------------------------------------------

app.get("/api/developers/:id/roles", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Developer ID is required"
    });
  }

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (d:Developer {id: $developerId})
            -[:HAS_SKILL]->
            (s:Skill)
            -[:REQUIRED_FOR]->
            (r:JobRole)

      RETURN
        r.title AS role,
        count(DISTINCT s) AS matchedSkills

      ORDER BY matchedSkills DESC
      `,
      {
        developerId: id
      }
    );

    const roles = result.records.map((record) => ({
      role: record.get("role"),
      matchedSkills: record.get("matchedSkills").toNumber()
    }));

    res.json({
      success: true,
      developerId: id,
      roles
    });
  } catch (error) {
    console.error("Matching roles error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to find matching roles"
    });
  } finally {
    await session.close();
  }
});

// --------------------------------------------------
// Find companies matching a developer
// Developer -> Skill -> JobRole -> Company
// --------------------------------------------------

app.get("/api/developers/:id/companies", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Developer ID is required"
    });
  }

  const session = driver.session();

  try {
    const result = await session.run(
      `
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
      `,
      {
        developerId: id
      }
    );

    const companies = result.records.map((record) => ({
      company: record.get("company"),
      role: record.get("role"),
      matchedSkills: record.get("matchedSkills").toNumber()
    }));

    res.json({
      success: true,
      developerId: id,
      companies
    });
  } catch (error) {
    console.error("Company traversal error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to find matching companies"
    });
  } finally {
    await session.close();
  }
});

// --------------------------------------------------
// Calculate skill gap
// Developer + JobRole -> Current Skills + Missing Skills
// --------------------------------------------------

app.get("/api/career-gap", async (req, res) => {
  const { developerId, role } = req.query;

  if (!developerId || !role) {
    return res.status(400).json({
      success: false,
      message: "developerId and role are required"
    });
  }

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (d:Developer {id: $developerId})
      MATCH (r:JobRole {title: $role})

      OPTIONAL MATCH (d)-[:HAS_SKILL]->(current:Skill)

      WITH
        d,
        r,
        collect(DISTINCT current.name) AS currentSkills

      MATCH (r)<-[:REQUIRED_FOR]-(required:Skill)

      RETURN
        d.name AS developer,
        r.title AS role,
        collect({
          skill: required.name,
          hasSkill: required.name IN currentSkills
        }) AS skills
      `,
      {
        developerId,
        role
      }
    );

    if (result.records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Developer or role not found"
      });
    }

    const record = result.records[0];
    const skills = record.get("skills");

    const currentSkills = skills
      .filter((skill) => skill.hasSkill)
      .map((skill) => skill.skill);

    const missingSkills = skills
      .filter((skill) => !skill.hasSkill)
      .map((skill) => skill.skill);

    res.json({
      success: true,
      developer: record.get("developer"),
      role: record.get("role"),
      currentSkills,
      missingSkills
    });
  } catch (error) {
    console.error("Career gap error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to calculate skill gap"
    });
  } finally {
    await session.close();
  }
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});