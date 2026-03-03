---
name: workspace-hygiene
description: Used to maintain absolute cleanliness in the project root directory. Triggers when writing debug scripts, logging outputs, or performing diagnostic tests.
---

# Workspace Hygiene (工作区卫生规范)

## Overview

This skill enforces strict hygiene rules for the workspace. The Root directory of a project is a sacred space only for configuration and source code. **It must NEVER be used as a dumping ground for temporary scripts, massive debug logs, or raw build artifacts.**

**Announce at start:** "I am adhering to the workspace-hygiene skill to keep the project root perfectly clean."

## Core Principles

### 1. No Temporary Scripts in Root

When you need to write a quick script to test an API, check database connections, or reproduce a bug (e.g., `test-db.ts`, `check-rds.js`, `tmp_fix.ps1`), **NEVER** save it in the project root.

- **Rule:** Always save these in a dedicated scratch directory or your agent temporary space.
- **Recommended Path:** Use `C:\Users\bigey\Documents\Antigravity\L2C\tmp\` or `<appDataDir>/tmp/`.

### 2. No Log Files in Root

When running commands that produce massive output (like ESLint reports, TypeScript compiler outputs, Playwright traces), **NEVER** redirect them to a `.txt` or `.log` file in the project root (e.g., `> test_output.txt`).

- **Rule:** Use terminal pagination, grep, or write the output specifically to an artifact or the `tmp/` folder.
- **Why?** It balloons the Docker build context and slows down deployments, potentially exposing sensitive structure.

### 3. Absolute Security for Certificates & Secrets

**NEVER** leave `.pem`, `.key`, or non-example `.env` files exposed in the root.

- **Rule:** Always place them securely in the `secrets/` directory if they must exist locally, as this directory is explicitly git-ignored.

### 4. Continuous Self-Cleaning

If you _must_ generate a temporary file during a multi-step execution plan, you are responsible for deleting it the moment the step is verified. Do not wait for the user to ask for a cleanup.

## Workflow Integration

If you notice the workspace is already dirty (you see `test-*.ts` or multiple `.txt` logs via `ls`), run the `/cleanup` workflow using the `run_command` tool to execute `pwsh` script or simply advise the user to use `/cleanup`.

## Red Flags

**Never:**

- Create `test.js` or `test.ts` in the root.
- Do `> error_report.txt` in the root.
- Leave `.tar.gz` after a manual deployment test.

**Always:**

- Clean up any script you create.
- Write to `tmp/` for scratch-pad purposes.
