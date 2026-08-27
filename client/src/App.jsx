import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [developers, setDevelopers] = useState([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState("");

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");

  const [careerGap, setCareerGap] = useState(null);

  const [loadingDevelopers, setLoadingDevelopers] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingGap, setLoadingGap] = useState(false);

  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load developers from CognoDB
  // --------------------------------------------------

  useEffect(() => {
    const loadDevelopers = async () => {
      try {
        setLoadingDevelopers(true);
        setError("");

        const response = await fetch(`${API}/api/developers`);

        if (!response.ok) {
          throw new Error("Failed to load developers");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        setDevelopers(data.developers);

        if (data.developers.length > 0) {
          setSelectedDeveloper(data.developers[0].id);
        }
      } catch (error) {
        console.error(error);
        setError(
          "Unable to connect to the SkillMatch server. Make sure the backend is running."
        );
      } finally {
        setLoadingDevelopers(false);
      }
    };

    loadDevelopers();
  }, []);

  // --------------------------------------------------
  // Load matching roles
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedDeveloper) return;

    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        setError("");
        setCareerGap(null);

        const response = await fetch(
          `${API}/api/developers/${selectedDeveloper}/roles`
        );

        if (!response.ok) {
          throw new Error("Failed to load roles");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        setRoles(data.roles);

        if (data.roles.length > 0) {
          setSelectedRole(data.roles[0].role);
        } else {
          setSelectedRole("");
        }
      } catch (error) {
        console.error(error);
        setError("Unable to load matching job roles.");
        setRoles([]);
        setSelectedRole("");
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, [selectedDeveloper]);

  // --------------------------------------------------
  // Developer changed
  // --------------------------------------------------

  const handleDeveloperChange = (event) => {
    setSelectedDeveloper(event.target.value);
    setCareerGap(null);
  };

  // --------------------------------------------------
  // Calculate skill gap
  // --------------------------------------------------

  const checkSkillGap = async () => {
    if (!selectedDeveloper || !selectedRole) {
      return;
    }

    try {
      setLoadingGap(true);
      setError("");
      setCareerGap(null);

      const params = new URLSearchParams({
        developerId: selectedDeveloper,
        role: selectedRole
      });

      const response = await fetch(
        `${API}/api/career-gap?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to calculate skill gap");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setCareerGap(data);
    } catch (error) {
      console.error(error);
      setError("Unable to calculate the skill gap.");
    } finally {
      setLoadingGap(false);
    }
  };

  // --------------------------------------------------
  // Calculate match percentage
  // --------------------------------------------------

  const getMatchPercentage = (matchedSkills) => {
    const percentage = matchedSkills * 20;

    return Math.min(percentage, 100);
  };

  return (
    <div className="app">
      {/* Header */}

      <header className="header">
        <div className="header-content">
          <p className="eyebrow">CAREER INTELLIGENCE</p>

          <h1>SkillMatch</h1>

          <p className="subtitle">
            Discover job roles based on your existing skills.
          </p>
        </div>
      </header>

      <main className="container">
        {/* Error */}

        {error && (
          <div className="error">
            <strong>Error</strong>
            <span>{error}</span>
          </div>
        )}

        {/* Developer Selector */}

        <section className="card developer-card">
          <div>
            <p className="section-label">PROFILE</p>
            <h2>Select Developer</h2>
            <p className="description">
              Choose a developer to analyze their career opportunities.
            </p>
          </div>

          <div className="select-wrapper">
            {loadingDevelopers ? (
              <div className="loading-select">
                Loading developers...
              </div>
            ) : (
              <select
                value={selectedDeveloper}
                onChange={handleDeveloperChange}
              >
                {developers.map((developer) => (
                  <option key={developer.id} value={developer.id}>
                    {developer.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>

        {/* Matching Roles */}

        <section className="section">
          <div className="section-header">
            <div>
              <p className="section-label">GRAPH ANALYSIS</p>
              <h2>Matching Job Roles</h2>
            </div>

            {!loadingRoles && (
              <span className="count">
                {roles.length} {roles.length === 1 ? "role" : "roles"}
              </span>
            )}
          </div>

          {loadingRoles ? (
            <div className="card loading-state">
              <div className="spinner"></div>
              <p>Analyzing your skills...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="card empty-state">
              <h3>No matching roles found</h3>
              <p>
                There are no matching job roles for this developer.
              </p>
            </div>
          ) : (
            <div className="roles-grid">
              {roles.map((item) => (
                <button
                  className={`role-card ${
                    selectedRole === item.role ? "selected" : ""
                  }`}
                  key={item.role}
                  onClick={() => {
                    setSelectedRole(item.role);
                    setCareerGap(null);
                  }}
                >
                  <div className="role-card-top">
                    <h3>{item.role}</h3>

                    {selectedRole === item.role && (
                      <span className="selected-badge">Selected</span>
                    )}
                  </div>

                  <p>
                    {item.matchedSkills}{" "}
                    {item.matchedSkills === 1
                      ? "matching skill"
                      : "matching skills"}
                  </p>

                  <div className="match-bar">
                    <div
                      style={{
                        width: `${getMatchPercentage(
                          item.matchedSkills
                        )}%`
                      }}
                    ></div>
                  </div>

                  <span className="percentage">
                    {getMatchPercentage(item.matchedSkills)}% match
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Skill Gap */}

        <section className="card skill-gap-card">
          <div className="section-header">
            <div>
              <p className="section-label">CAREER FIT</p>
              <h2>Skill Gap Analysis</h2>
              <p className="description">
                Compare your current skills with the requirements of a
                target role.
              </p>
            </div>
          </div>

          <div className="gap-controls">
            <select
              value={selectedRole}
              onChange={(event) => {
                setSelectedRole(event.target.value);
                setCareerGap(null);
              }}
              disabled={roles.length === 0}
            >
              {roles.length === 0 ? (
                <option>No roles available</option>
              ) : (
                roles.map((item) => (
                  <option key={item.role} value={item.role}>
                    {item.role}
                  </option>
                ))
              )}
            </select>

            <button
              className="analyze-button"
              onClick={checkSkillGap}
              disabled={loadingGap || !selectedRole}
            >
              {loadingGap ? "Analyzing..." : "Analyze Skill Gap"}
            </button>
          </div>

          {careerGap && (
            <div className="gap-results">
              <div className="gap-summary">
                <div>
                  <span>Developer</span>
                  <strong>{careerGap.developer}</strong>
                </div>

                <div>
                  <span>Target Role</span>
                  <strong>{careerGap.role}</strong>
                </div>

                <div>
                  <span>Missing</span>
                  <strong>{careerGap.missingSkills.length}</strong>
                </div>
              </div>

              <div className="skills-columns">
                <div className="skills-section">
                  <div className="skills-title">
                    <h3>Current Skills</h3>
                    <span>{careerGap.currentSkills.length}</span>
                  </div>

                  {careerGap.currentSkills.length > 0 ? (
                    <div className="skills-list">
                      {careerGap.currentSkills.map((skill) => (
                        <span
                          className="skill current"
                          key={skill}
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="no-skills">
                      No matching skills found.
                    </p>
                  )}
                </div>

                <div className="skills-section">
                  <div className="skills-title">
                    <h3>Missing Skills</h3>
                    <span>{careerGap.missingSkills.length}</span>
                  </div>

                  {careerGap.missingSkills.length > 0 ? (
                    <div className="skills-list">
                      {careerGap.missingSkills.map((skill) => (
                        <span
                          className="skill missing"
                          key={skill}
                        >
                          + {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="complete">
                      You already have all required skills.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}

        <footer>
          <span>SkillMatch</span>
          <span>Powered by CognoDB</span>
        </footer>
      </main>
    </div>
  );
}

export default App;