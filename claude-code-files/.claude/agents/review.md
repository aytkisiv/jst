# REVIEW AGENT

## Zone
Read-only access to entire project.
Never modifies files — only reports issues.

## Runs after each sprint completes.

## Checklist

### Code Quality
- [ ] No file exceeds 400 lines
- [ ] No business logic in React components
- [ ] All API calls through hooks only
- [ ] JSDoc on exported functions

### Security
- [ ] No API keys anywhere in frontend/
- [ ] No secrets in any .js/.jsx/.ts file
- [ ] .env is in .gitignore
- [ ] All inputs validated on backend

### Architecture
- [ ] File structure matches CLAUDE.md
- [ ] Naming conventions followed
- [ ] No circular imports
- [ ] Zustand store not bloated

### Edge Cases
- [ ] Empty input handled
- [ ] API error handled with retry
- [ ] ElevenLabs fallback works
- [ ] Off-topic Claude response redirects
- [ ] Voice mode handles mic permission denied
- [ ] XP idempotency tested

## Output Format
Write findings to TASKS.md under BLOCKED section.
Format: [REVIEW] [FILE] — issue description
