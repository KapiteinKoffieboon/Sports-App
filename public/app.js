/* Sports App – frontend logic
 * Talks to the Cloudflare Worker at /api/*
 */

const API = "/api";

// ── Navigation ────────────────────────────────────────────────────────────────
const navBtns = document.querySelectorAll(".nav-btn");
const views   = document.querySelectorAll(".view");

function showView(name) {
  views.forEach(v => v.classList.toggle("active", v.id === `view-${name}`));
  navBtns.forEach(b => b.classList.toggle("active", b.dataset.view === name));
  if (name === "matches") loadMatches();
  if (name === "sports")  loadSports();
  if (name === "teams")   loadTeams();
  if (name === "add-match") loadFormSports();
}

navBtns.forEach(btn =>
  btn.addEventListener("click", () => showView(btn.dataset.view))
);

// ── Helpers ───────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") elem.className = v;
    else if (k.startsWith("on")) elem.addEventListener(k.slice(2).toLowerCase(), v);
    else elem.setAttribute(k, v);
  });
  children.flat().forEach(c =>
    elem.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return elem;
}

function setOptions(select, items, valueKey, labelFn, placeholder = null) {
  select.innerHTML = "";
  if (placeholder !== null) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    select.appendChild(opt);
  }
  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item[valueKey];
    opt.textContent = labelFn(item);
    select.appendChild(opt);
  });
}

// ── Matches ───────────────────────────────────────────────────────────────────
const filterSport = document.getElementById("filter-sport");
filterSport.addEventListener("change", loadMatches);

async function loadMatches() {
  const list = document.getElementById("matches-list");
  list.innerHTML = `<p class="state-msg">Loading…</p>`;

  // Populate filter if empty
  if (filterSport.options.length === 1) {
    try {
      const sports = await apiFetch("/sports");
      sports.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.icon} ${s.name}`;
        filterSport.appendChild(opt);
      });
    } catch (_) { /* ignore */ }
  }

  const sportId = filterSport.value;
  const qs = sportId ? `?sport_id=${sportId}` : "";

  try {
    const matches = await apiFetch(`/matches${qs}`);
    list.innerHTML = "";

    if (!matches.length) {
      list.innerHTML = `<p class="state-msg">No matches found. Add one!</p>`;
      return;
    }

    matches.forEach(m => {
      const card = el("div", { className: "match-card" },
        el("span", { className: "sport-tag" }, `${m.sport_icon} ${m.sport_name}`),
        el("div", { className: "scoreboard" },
          el("span", { className: "team home" }, m.home_team_name),
          el("span", { className: "score" }, `${m.home_score} – ${m.away_score}`),
          el("span", { className: "team away" }, m.away_team_name)
        ),
        el("span", { className: "meta" }, `📅 ${m.match_date}  📍 ${m.location || "—"}`),
        el("button", {
          className: "delete-btn",
          onClick: async () => {
            if (!confirm("Delete this match?")) return;
            try {
              await apiFetch(`/matches/${m.id}`, { method: "DELETE" });
              loadMatches();
            } catch (e) { alert(e.message); }
          }
        }, "Delete")
      );
      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = `<p class="state-msg" style="color:#dc2626">Error: ${e.message}</p>`;
  }
}

// ── Sports ────────────────────────────────────────────────────────────────────
async function loadSports() {
  const list = document.getElementById("sports-list");
  list.innerHTML = `<p class="state-msg">Loading…</p>`;
  try {
    const sports = await apiFetch("/sports");
    list.innerHTML = "";
    sports.forEach(s => {
      list.appendChild(
        el("div", { className: "sport-card" },
          el("div", { className: "icon" }, s.icon),
          el("h3", {}, s.name)
        )
      );
    });
  } catch (e) {
    list.innerHTML = `<p class="state-msg" style="color:#dc2626">Error: ${e.message}</p>`;
  }
}

// ── Teams ─────────────────────────────────────────────────────────────────────
const filterTeamSport = document.getElementById("filter-team-sport");
filterTeamSport.addEventListener("change", loadTeams);

async function loadTeams() {
  const list = document.getElementById("teams-list");
  list.innerHTML = `<p class="state-msg">Loading…</p>`;

  if (filterTeamSport.options.length === 1) {
    try {
      const sports = await apiFetch("/sports");
      sports.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.icon} ${s.name}`;
        filterTeamSport.appendChild(opt);
      });
    } catch (_) { /* ignore */ }
  }

  const sportId = filterTeamSport.value;
  const qs = sportId ? `?sport_id=${sportId}` : "";

  try {
    const teams = await apiFetch(`/teams${qs}`);
    list.innerHTML = "";
    if (!teams.length) {
      list.innerHTML = `<p class="state-msg">No teams found.</p>`;
      return;
    }
    teams.forEach(t => {
      list.appendChild(
        el("div", { className: "team-card" },
          el("h3", {}, t.name),
          el("div", { className: "sport-tag" }, t.sport_name)
        )
      );
    });
  } catch (e) {
    list.innerHTML = `<p class="state-msg" style="color:#dc2626">Error: ${e.message}</p>`;
  }
}

// ── Add match form ─────────────────────────────────────────────────────────────
const formSport     = document.getElementById("form-sport");
const formHomeTeam  = document.getElementById("form-home-team");
const formAwayTeam  = document.getElementById("form-away-team");

async function loadFormSports() {
  try {
    const sports = await apiFetch("/sports");
    setOptions(formSport, sports, "id", s => `${s.icon} ${s.name}`, "Select sport");
    formHomeTeam.innerHTML = `<option value="">Select sport first</option>`;
    formAwayTeam.innerHTML = `<option value="">Select sport first</option>`;
  } catch (e) {
    document.getElementById("form-msg").textContent = `Failed to load sports: ${e.message}`;
  }
}

formSport.addEventListener("change", async () => {
  const sportId = formSport.value;
  if (!sportId) return;
  try {
    const teams = await apiFetch(`/sports/${sportId}/teams`);
    setOptions(formHomeTeam, teams, "id", t => t.name, "Select home team");
    setOptions(formAwayTeam, teams, "id", t => t.name, "Select away team");
  } catch (e) {
    alert(`Could not load teams: ${e.message}`);
  }
});

document.getElementById("add-match-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("form-msg");
  msg.textContent = "";
  msg.className = "form-msg";

  const body = {
    sport_id:     parseInt(formSport.value, 10),
    home_team_id: parseInt(formHomeTeam.value, 10),
    away_team_id: parseInt(formAwayTeam.value, 10),
    home_score:   parseInt(document.getElementById("form-home-score").value, 10),
    away_score:   parseInt(document.getElementById("form-away-score").value, 10),
    match_date:   document.getElementById("form-date").value,
    location:     document.getElementById("form-location").value,
  };

  if (body.home_team_id === body.away_team_id) {
    msg.textContent = "Home and away team must be different.";
    msg.className = "form-msg error";
    return;
  }

  try {
    await apiFetch("/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    msg.textContent = "Match saved!";
    msg.className = "form-msg success";
    e.target.reset();
  } catch (err) {
    msg.textContent = `Error: ${err.message}`;
    msg.className = "form-msg error";
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadMatches();
