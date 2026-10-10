# VOLT RUN: NEON PURSUIT

An independent near-future e-bike game prototype for browsers and Docker Swarm. The original VOLT RUN remains a separate arcade game.

## Play locally

Requires Node.js 22. Run `npm ci`, then `npm start`. The default port is 8080; set PORT=8098 to run beside the arcade game. Open http://localhost:8098 when using that port.

WASD/arrows ride; Space hops; Shift boosts only on the ground; Q/E/F/X/C perform aerial tricks; V wheelies; B banks; G opens the garage. Create a room and share its invite for multiplayer. Crew races require two riders.

## Prototype scope

The first playable district adds dark city lighting, emissive architecture and signs, wet road materials with environment reflections, bloom, rainfall, and smoother lateral inertia and speed response. High/Low graphics controls reduce bloom, rain, shadows and pixel density. Both original bike models are retained, with per-player rider/bike customisation, stunts, traffic, police rotation, crew races and credit prizes. Browser saves use a separate neon namespace.

This is a playable foundation, not the finished realistic rebuild. The current map is a forward-moving city loop. Multiplayer uses client-reported positions and in-memory rooms; profiles, authoritative physics, articulated suspension/rider animation, a freely explorable street network, and durable shared storage remain future milestones. Environment reflections are approximate, not ray traced.

## Docker Swarm

Build `docker build -t ghcr.io/virtualhowto/volt-run-neon-pursuit:latest .` and push that image to a registry accessible to your swarm. Deploy with `docker stack deploy -c stack.yml neon-pursuit`. The service publishes port 8098, separate from the arcade deployment. Use NEON_IMAGE to choose an image tag. Keep one replica while rooms are in memory. WebSocket traffic uses `/ride`; health uses `/health`. TLS belongs at your existing ingress proxy.

## Validation

`npm test` runs physics, stunts, appearance, server and multiplayer race/reward checks.

## Next milestones

1. Replace the loop with a connected district and steering physics.
2. Articulated suspension, wheel motion and rider animation.
3. Server-controlled physics and durable player profiles.
4. Production ingress, shared storage and deployment-specific configuration.

GitHub Actions runs tests and a Docker build on pushes and pull requests. Run the Publish Docker image workflow manually to push latest and commit SHA tags to GHCR. For a private GHCR package, authenticate the Swarm nodes and deploy with --with-registry-auth. This repository does not automatically deploy to your cluster.
