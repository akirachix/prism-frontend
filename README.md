# fe-sample-template

## Pull Request Rules

Every PR uses the [PR template](.github/pull_request_template.md). Fill in every section.

### 1. Open PRs as a draft
Always open a new PR as a **Draft**. Keep it as a draft while you are still working on it.

### 2. Add screenshots and a recording
In the **Screenshots & Recordings** section of the PR description:
- Drag and drop a **recording** of the changes (.mp4 / .mov, or a Loom / YouTube / Google Drive link).
- Drag and drop **at least 2 screenshots** across different screens (mobile, tablet, desktop), with before and after where it applies.

### 3. Add the Figma designs
In the **Figma Designs** section of the PR description:
- Paste the **Figma link** (a `figma.com` URL).
- Drag and drop **at least 1 screenshot** of the design.

### 4. Only mark as "Ready for review" when everything passes
The **Ready for Review** checklist at the bottom of the PR description has 4 items:

| Item | Who ticks it |
| --- | --- |
| 🤖 All CI checks pass (build, lint, tests) | CI |
| 🤖 Recording and screenshots across different screens are attached | CI |
| 🤖 Figma design screenshots and link are attached | CI |
| Self-reviewed the code and tested the changes locally | You |

Don't tick the 🤖 items yourself. CI checks them on every update and ticks or unticks them to match what it finds. Mark the PR as **Ready for review** only when all 4 are ticked.

### How this is enforced
The [PR Ready Check](.github/workflows/pr-ready-check.yml) workflow ([script](.github/scripts/pr-ready-check.js)) runs whenever a PR is opened, edited, gets new commits, or is marked ready for review. It:
1. Waits up to 10 minutes for the PR's other CI checks to finish.
2. Looks for the recording, screenshots, Figma link and Figma screenshot in the PR description.
3. Ticks or unticks the 🤖 items in the PR description to match.
4. **Draft PRs:** never fails, so you can see what's still missing.
5. **PRs marked Ready for review:** fails if any item is unticked. The failure message and the run summary say what is missing.

To fix a failing check, add what's missing to the PR description (or fix the failing CI check and push). The check runs again when you edit the description or push. If another CI check finished after the 10-minute wait, re-run the **Ready for Review checklist** check from the PR's Checks tab.

A PR cannot be merged into `main` or `develop` until all required checks pass.
