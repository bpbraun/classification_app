# Deploying to demo.braun-ai.com

One-time setup takes about 15 minutes, plus DNS propagation (usually under an hour, occasionally longer). Do it by Saturday, November 7.

## 1. Turn On GitHub Pages

1. Open the repo on GitHub, then **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Under **Custom domain**, enter `demo.braun-ai.com` and save. (The build also ships a `CNAME` file with this name.)

## 2. Verify the Domain With GitHub (Prevents Takeover)

1. On GitHub, open your profile **Settings → Pages → Add a domain**, enter `braun-ai.com`.
2. GitHub shows a TXT record: a host like `_github-pages-challenge-bpbraun` and a value. Keep that tab open.

## 3. Add the DNS Records in Squarespace

Squarespace: **Domains → braun-ai.com → DNS → DNS Settings → Custom Records → Add record**.

| Host                                            | Type  | Data                    |
| ----------------------------------------------- | ----- | ----------------------- |
| `demo`                                          | CNAME | `bpbraun.github.io`     |
| `_github-pages-challenge-bpbraun` (from step 2) | TXT   | the value GitHub showed |

Leave every existing record alone. The main site keeps running on Squarespace.

Then go back to GitHub and click **Verify** on the domain from step 2.

## 4. Enforce HTTPS

After the DNS check passes on **Settings → Pages** (it can take a few minutes), tick **Enforce HTTPS**.

## 5. Publish

1. **Model run:** **Actions → Run model → Run workflow** on `main`. It needs the `ANTHROPIC_API_KEY` repository secret (**Settings → Secrets and variables → Actions**). It opens a review branch with the citations.
2. **Review and merge:** Read the citations in the pull request, then merge it. Merging to `main` runs the deploy.
3. **Check:** Open https://demo.braun-ai.com on a phone.

The deploy refuses to publish placeholder citations, stale citations, or data built from a different PDF.

## Rollback

**Actions → Deploy to GitHub Pages**, open an earlier successful run, and choose **Re-run all jobs**. That republishes that commit's site.
