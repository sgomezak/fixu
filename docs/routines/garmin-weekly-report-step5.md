# Garmin weekly report: step to add (FixU)

Paste this into the **Garmin weekly report** routine (Claude desktop app on your work computer → Routines / scheduled tasks → Garmin weekly report → edit), between step **4) PUBLISH** and step **5) REPORT**. Rename **5) REPORT** to **6) REPORT** and add "and whether FixU was updated (step 5)" to its last sentence.

---

5) FIXU. Copy the same data into the FixU app so its Health page shows it. Load the add_repo tool of the Claude Code Remote connector (ToolSearch "add_repo") and call it with owner "sgomezak", repo "fixu", access "push"; clone with the exact command it returns (e.g. git clone --depth 1 https://github.com/sgomezak/fixu /home/claude/fixu). Copy /home/claude/garmin/out/daily.csv to data/garmin/daily.csv and /home/claude/garmin/out/activities.csv to data/garmin/activities.csv in the clone, replacing them (they hold the full history; the header row must stay exactly as build.py writes it). Change nothing else in the repository. Then: git add data/garmin, git commit -m "Garmin data up to <last date in daily.csv>", git pull --rebase origin main, git push origin main. Vercel redeploys FixU on its own in 1–2 minutes. If add_repo, the clone or the push fails, do not try another way: say so in the final message. A failure here does not undo steps 3–4.
