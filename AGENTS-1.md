# AGENTS.md — Copilot Usage Guidelines for This Repository

## Model Selection (Cost Management)

Budget is limited and monitored (~€700/month pool after free credits are consumed).
Follow this priority order:

1. **Default to GPT / Auto Mode** for all routine work:
   - Code completion, boilerplate generation
   - Unit test generation
   - Small refactoring
   - Quick explanations of existing code
   - Everyday development tasks

2. **Use Claude only when the task genuinely requires deeper reasoning**, such as:
   - Complex architectural analysis
   - Large-scale, multi-file refactoring initiatives
   - Understanding legacy/unfamiliar applications
   - Multi-step investigations (e.g. root-cause debugging across services)

3. **Before escalating to a premium model, ask: "Can GPT/Auto Mode solve this?"**
   If yes, use it. Do not default to premium models when a standard model is sufficient.

4. Avoid repeated prompts that don't materially improve results. Review generated
   output carefully before requesting additional generations — don't re-roll.

## Token / Cost Economy (General)

- Prefer a single diagnostic command or action that answers the question over a
  longer speculative investigation sequence.
- Do not run exploratory or speculative fixes (restarting unrelated services,
  reinstalling tools, etc.) without first confirming the actual root cause.
- Stop and report findings once the root cause is identified — do not continue
  "trying things" after a diagnosis is already clear.
- If a task is taking many steps with no progress, pause and summarize findings
  instead of continuing to burn calls.

## Database / Remote Service Connectivity Troubleshooting

When troubleshooting a failed connection to a remote service (e.g. Azure Postgres,
hosts containing `.database.azure.com`, or any cloud-hosted dependency):

**Do NOT:**
- Start, stop, or restart local Docker / docker-compose services
- Assume the problem is local infrastructure unless explicitly asked
- Run multi-step diagnostic sequences before checking the simplest cause first

**DO, in this order — stop as soon as one step identifies the issue:**
1. Confirm the connection string/URL syntax is correct (scheme, host, port
   separator `:`, database name)
2. Run DNS resolution (`nslookup <host>`) — check if it resolves to a
   `.private.*` domain (indicates a private endpoint, not a public one)
3. Run `Test-NetConnection <host> -Port <port>` to check TCP reachability
4. Only if DNS and TCP succeed, investigate SSL mode or credentials

**If DNS resolves to a private endpoint or TCP fails:**
- Stop immediately. This is a network/infra access issue (VPN, bastion host,
  or firewall allowlisting required), not a client configuration problem.
- Report this clearly and suggest asking a teammate/admin how they personally
  connect, rather than attempting further local fixes.

## Security and Compliance Requirements

Developers remain fully responsible for all code committed to EFI repositories.

**Always:**
- Review AI-generated code for correctness before use
- Verify compliance with EFI development standards
- Validate security controls and secure coding practices
- Apply normal SDLC, peer review, and testing procedures
- Ensure generated code complies with regulatory and internal policy requirements

**Never:**
- Blindly commit AI-generated code
- Bypass established development controls
- Assume AI-generated output is correct without verification
- Circumvent security, compliance, or data-handling requirements

## Responsible AI Usage

- AI-generated content is developer-assisted content, not final output
- Accountability remains with the developer and team, not the AI
- AI output may contain errors, inaccuracies, or inefficient implementations
- Security and quality standards remain unchanged regardless of code origin

## Code Quality Standards (React + Spring Boot + Docker)

Act as a senior engineer: **15-20 years experience level in React (advanced) and
Java/Spring Boot (expert)**. Code must reflect that seniority — clean, idiomatic,
production-grade, not "just working" code.

### General Principles
- Write optimized code by default — consider time/space complexity, unnecessary
  re-renders (React), N+1 queries, unneeded object allocations (Java), and avoid
  premature abstraction as well as under-engineering.
- Follow existing project conventions and architecture patterns before introducing
  new ones. Don't refactor unrelated code while doing a feature/fix.
- Prefer clarity and maintainability over cleverness.

### React
- Functional components with hooks; avoid unnecessary state, prop drilling, and
  redundant re-renders (use memoization deliberately, not by default).
- Proper key usage, no inline function/object creation in render paths where it
  causes avoidable re-renders.
- Type safety enforced (TypeScript/PropTypes as applicable to this project).
- No console.logs, dead code, or commented-out blocks left in delivered code.

### Java / Spring Boot
- Follow SOLID principles and existing layered architecture (controller/service/
  repository) — no business logic in controllers.
- Proper exception handling — no swallowed exceptions, no generic catch-alls
  without logging/handling.
- Use constructor injection, not field injection.
- No unused imports, unused variables, or unreachable code.

### Linting / Static Analysis
- Code must pass linting with **zero warnings or errors** before being considered
  done — not just "no errors," no warnings either.
- Run the project's configured linter (ESLint for React, Checkstyle/Spotbugs/
  equivalent for Java) before presenting any code as complete.
- If a lint rule must be violated for a valid reason, flag it explicitly and
  explain why — never silently suppress with blanket ignore comments.

### Pre-Delivery Checklist (mandatory, every time)
Before presenting code as done, always:
1. **Self-review the diff** as a senior engineer would — check logic correctness,
   edge cases, naming, and consistency with existing code style.
2. **Run the build** (`mvn clean install` / `npm run build` or project equivalent)
   and confirm it passes cleanly.
3. **Run lint checks** and confirm zero issues.
4. **Run tests** (unit + relevant integration tests) and confirm they pass.
5. **Run a vulnerability/dependency scan** (e.g. `npm audit`, `mvn dependency-check`,
   or the project's configured tool) and flag any new high/critical findings
   introduced by the change.
6. **Check the Docker base image** when Dockerfiles are touched or dependencies
   change — confirm it's still a maintained, non-EOL, minimal-footprint image
   (prefer slim/alpine/distroless variants where compatible), and flag if the
   pinned version has known CVEs.

Do not present a change as "ready" or "done" if any of the above steps were
skipped — say explicitly which steps were run and their results.

## Protected Files — Never Modify

**Never edit, overwrite, or touch environment/config files for staging or
production**, including but not limited to:
- `application-stg.yaml`, `application-prod.yaml` (or equivalent per-environment
  config files)
- Any file containing STG/PROD credentials, connection strings, secrets, or
  environment-specific URLs/hosts

If a task appears to require a change to one of these files, **stop and ask**
rather than modifying it — these are managed outside of normal dev changes and
require explicit approval.

## Recommended Workflow (Default Approach)

1. Start with GPT or Auto Mode
2. Review the output
3. Use Claude only if the task requires deeper analysis or broader reasoning
4. Validate all generated code before committing
5. Consider budget impact when selecting premium models

**Key principle:** Use the simplest model that successfully solves the problem.

## Questions

For questions about this policy, contact the team leads (see internal AI_FAQ
document) before escalating usage patterns that deviate from these guidelines.
