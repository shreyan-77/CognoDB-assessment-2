import dotenv from "dotenv";
import neo4j from "neo4j-driver";

dotenv.config();

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(
    process.env.COGNODB_USERNAME,
    process.env.COGNODB_PASSWORD
  )
);

const developers = [
  { id: "dev1", name: "Shreyan Sharma", experience: 1 },
  { id: "dev2", name: "Rahul Mehta", experience: 2 },
  { id: "dev3", name: "Ananya Rao", experience: 3 },
  { id: "dev4", name: "Arjun Kumar", experience: 2 },
  { id: "dev5", name: "Priya Singh", experience: 4 }
];

const skills = [
  "Python",
  "JavaScript",
  "React",
  "Node.js",
  "MongoDB",
  "SQL",
  "Java",
  "Docker",
  "Git",
  "TypeScript",
  "FastAPI",
  "Machine Learning"
];

const roles = [
  "Full Stack Developer",
  "Backend Engineer",
  "Frontend Developer",
  "AI Engineer",
  "Software Engineer",
  "DevOps Engineer"
];

const companies = [
  "TechNova",
  "CloudWorks",
  "DataSphere",
  "CodeCraft",
  "InnovateLabs"
];

const developerSkills = {
  dev1: ["Python", "JavaScript", "React", "Node.js", "MongoDB", "Git"],
  dev2: ["JavaScript", "React", "TypeScript", "Git"],
  dev3: ["Python", "SQL", "Machine Learning", "Git"],
  dev4: ["Java", "SQL", "Docker", "Git"],
  dev5: ["Python", "JavaScript", "Node.js", "Docker", "TypeScript"]
};

const roleSkills = {
  "Full Stack Developer": ["JavaScript", "React", "Node.js", "MongoDB", "TypeScript"],
  "Backend Engineer": ["Python", "Node.js", "SQL", "MongoDB", "Docker"],
  "Frontend Developer": ["JavaScript", "React", "TypeScript"],
  "AI Engineer": ["Python", "Machine Learning", "SQL", "Docker"],
  "Software Engineer": ["Java", "Python", "Git", "SQL"],
  "DevOps Engineer": ["Docker", "Python", "Git", "SQL"]
};

const companyRoles = {
  TechNova: ["Full Stack Developer", "Software Engineer"],
  CloudWorks: ["Backend Engineer", "DevOps Engineer"],
  DataSphere: ["AI Engineer", "Data Engineer"],
  CodeCraft: ["Frontend Developer", "Full Stack Developer"],
  InnovateLabs: ["AI Engineer", "Backend Engineer"]
};

async function seed() {
  const session = driver.session();

  try {
    console.log("Clearing existing graph...");

    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating developers...");

    for (const developer of developers) {
      await session.run(
        `
        CREATE (d:Developer {
          id: $id,
          name: $name,
          experience: $experience
        })
        `,
        developer
      );
    }

    console.log("Creating skills...");

    for (const name of skills) {
      await session.run(
        `
        CREATE (s:Skill {
          name: $name
        })
        `,
        { name }
      );
    }

    console.log("Creating job roles...");

    for (const title of roles) {
      await session.run(
        `
        CREATE (r:JobRole {
          title: $title
        })
        `,
        { title }
      );
    }

    console.log("Creating companies...");

    for (const name of companies) {
      await session.run(
        `
        CREATE (c:Company {
          name: $name
        })
        `,
        { name }
      );
    }

    console.log("Creating developer → skill relationships...");

    for (const [developerId, developerSkillList] of Object.entries(
      developerSkills
    )) {
      for (const skill of developerSkillList) {
        await session.run(
          `
          MATCH (d:Developer {id: $developerId})
          MATCH (s:Skill {name: $skill})
          CREATE (d)-[:HAS_SKILL]->(s)
          `,
          { developerId, skill }
        );
      }
    }

    console.log("Creating skill → role relationships...");

    for (const [role, roleSkillList] of Object.entries(roleSkills)) {
      for (const skill of roleSkillList) {
        await session.run(
          `
          MATCH (s:Skill {name: $skill})
          MATCH (r:JobRole {title: $role})
          CREATE (s)-[:REQUIRED_FOR]->(r)
          `,
          { skill, role }
        );
      }
    }

    console.log("Creating company → role relationships...");

    for (const [company, companyRoleList] of Object.entries(companyRoles)) {
      for (const role of companyRoleList) {
        await session.run(
          `
          MATCH (c:Company {name: $company})
          MATCH (r:JobRole {title: $role})
          CREATE (r)-[:HIRED_BY]->(c)
          `,
          { company, role }
        );
      }
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();