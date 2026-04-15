/**
 * Sports App – Cloudflare Worker
 *
 * Routes:
 *   GET  /api/sports            – list all sports
 *   GET  /api/sports/:id/teams  – list teams for a sport
 *   GET  /api/matches           – list all matches (optional ?sport_id=)
 *   POST /api/matches           – create a match
 *   GET  /api/matches/:id       – get a single match
 *   PUT  /api/matches/:id       – update score / details
 *   DELETE /api/matches/:id     – delete a match
 *   GET  /api/teams             – list all teams (optional ?sport_id=)
 *   POST /api/teams             – create a team
 *
 * All other requests are served from Cloudflare Pages (public/).
 */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

function notFound(message = "Not found") {
  return json({ error: message }, 404);
}

function badRequest(message = "Bad request") {
  return json({ error: message }, 400);
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;

  // Handle CORS pre-flight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  // Only handle /api/* routes in the Worker
  if (!pathname.startsWith("/api/")) {
    return null; // let Pages serve the static files
  }

  const parts = pathname.replace(/^\/api\//, "").split("/");

  // ── /api/sports ─────────────────────────────────────────────────────────────
  if (parts[0] === "sports") {
    // GET /api/sports/:id/teams
    if (parts.length === 3 && parts[2] === "teams") {
      const sportId = parseInt(parts[1], 10);
      if (isNaN(sportId)) return badRequest("Invalid sport id");
      const { results } = await env.DB.prepare(
        "SELECT * FROM teams WHERE sport_id = ? ORDER BY name"
      )
        .bind(sportId)
        .all();
      return json(results);
    }

    // GET /api/sports
    if (parts.length === 1 && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM sports ORDER BY name"
      ).all();
      return json(results);
    }
  }

  // ── /api/teams ───────────────────────────────────────────────────────────────
  if (parts[0] === "teams") {
    if (request.method === "GET") {
      const sportId = url.searchParams.get("sport_id");
      let stmt;
      if (sportId) {
        stmt = env.DB.prepare(
          "SELECT t.*, s.name AS sport_name FROM teams t JOIN sports s ON s.id = t.sport_id WHERE t.sport_id = ? ORDER BY t.name"
        ).bind(parseInt(sportId, 10));
      } else {
        stmt = env.DB.prepare(
          "SELECT t.*, s.name AS sport_name FROM teams t JOIN sports s ON s.id = t.sport_id ORDER BY t.name"
        );
      }
      const { results } = await stmt.all();
      return json(results);
    }

    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return badRequest("Invalid JSON body");
      }
      const { name, sport_id } = body;
      if (!name || !sport_id) return badRequest("name and sport_id are required");

      const result = await env.DB.prepare(
        "INSERT INTO teams (name, sport_id) VALUES (?, ?) RETURNING *"
      )
        .bind(name.trim(), parseInt(sport_id, 10))
        .first();
      return json(result, 201);
    }
  }

  // ── /api/matches ─────────────────────────────────────────────────────────────
  if (parts[0] === "matches") {
    const matchesBase = `
      SELECT m.*,
             ht.name AS home_team_name,
             at.name AS away_team_name,
             s.name  AS sport_name,
             s.icon  AS sport_icon
      FROM matches m
      JOIN teams  ht ON ht.id = m.home_team_id
      JOIN teams  at ON at.id = m.away_team_id
      JOIN sports s  ON s.id  = m.sport_id
    `;

    // GET/PUT/DELETE /api/matches/:id
    if (parts.length === 2) {
      const matchId = parseInt(parts[1], 10);
      if (isNaN(matchId)) return badRequest("Invalid match id");

      if (request.method === "GET") {
        const row = await env.DB.prepare(
          matchesBase + " WHERE m.id = ?"
        )
          .bind(matchId)
          .first();
        if (!row) return notFound("Match not found");
        return json(row);
      }

      if (request.method === "PUT") {
        let body;
        try {
          body = await request.json();
        } catch {
          return badRequest("Invalid JSON body");
        }
        const { home_score, away_score, match_date, location } = body;
        await env.DB.prepare(
          `UPDATE matches
           SET home_score = COALESCE(?, home_score),
               away_score = COALESCE(?, away_score),
               match_date = COALESCE(?, match_date),
               location   = COALESCE(?, location)
           WHERE id = ?`
        )
          .bind(
            home_score ?? null,
            away_score ?? null,
            match_date ?? null,
            location ?? null,
            matchId
          )
          .run();
        const updated = await env.DB.prepare(
          matchesBase + " WHERE m.id = ?"
        )
          .bind(matchId)
          .first();
        if (!updated) return notFound("Match not found");
        return json(updated);
      }

      if (request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM matches WHERE id = ?")
          .bind(matchId)
          .run();
        return json({ success: true });
      }
    }

    // GET /api/matches  or  POST /api/matches
    if (parts.length === 1) {
      if (request.method === "GET") {
        const sportId = url.searchParams.get("sport_id");
        let stmt;
        if (sportId) {
          stmt = env.DB.prepare(
            matchesBase + " WHERE m.sport_id = ? ORDER BY m.match_date DESC"
          ).bind(parseInt(sportId, 10));
        } else {
          stmt = env.DB.prepare(
            matchesBase + " ORDER BY m.match_date DESC"
          );
        }
        const { results } = await stmt.all();
        return json(results);
      }

      if (request.method === "POST") {
        let body;
        try {
          body = await request.json();
        } catch {
          return badRequest("Invalid JSON body");
        }
        const { sport_id, home_team_id, away_team_id, home_score, away_score, match_date, location } = body;
        if (!sport_id || !home_team_id || !away_team_id || !match_date) {
          return badRequest("sport_id, home_team_id, away_team_id, and match_date are required");
        }
        const result = await env.DB.prepare(
          `INSERT INTO matches (sport_id, home_team_id, away_team_id, home_score, away_score, match_date, location)
           VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
        )
          .bind(
            parseInt(sport_id, 10),
            parseInt(home_team_id, 10),
            parseInt(away_team_id, 10),
            parseInt(home_score ?? 0, 10),
            parseInt(away_score ?? 0, 10),
            match_date,
            (location ?? "").trim()
          )
          .first();
        return json(result, 201);
      }
    }
  }

  return notFound();
}

export default {
  async fetch(request, env) {
    try {
      const response = await handleRequest(request, env);
      if (response) return response;
      // Fallback: serve static assets via the Pages asset binding (if configured)
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return new Response("Not found", { status: 404 });
    } catch (err) {
      return json({ error: err.message || "Internal server error" }, 500);
    }
  },
};
