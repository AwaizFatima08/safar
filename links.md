# Urdu Safar — reference links

- **Live app (published Artifact):** https://claude.ai/code/artifact/0514d38c-5ff0-48ee-a245-ea5ee198bbe8
  This is the URL to open the current working version in a browser. Re-published each time the app changes; the link itself stays the same.
- **Claude Project:** "O level urdu app" — holds the two source Kawish PDFs (`800563633-Kawish-2.pdf`, `800563680-Kawish-1.pdf`) plus copies of the docs in this folder. Export those PDFs from the project if you want them physically on the NAS too (I can't reach the NAS directly to place them there myself).
- **GitHub backup:** https://github.com/AwaizFatima08/safar
- **Google Drive backup:** https://drive.google.com/drive/folders/1UvdAuwv-Gp67cHBCxVf28DahukxJHh3Q

## Project structure (as of the multi-file restructure)

```
safar/
├── content/            source content — one JSON file per topic/skill (see README.md)
├── src/                app.js, styles.css, index.template.html
├── build/build.js       run this after editing content/ or src/
├── dist/app.html        GENERATED — this is the file to publish/ship, never hand-edit
├── docs/                planning docs (login scope, Play Store plan, command board)
├── scripts/backup_safar.sh
└── links.md              (this file)
```

**Note (superseded):** this project used to be a single flat `app/app.html` file with no `content/`, `src/`, or `build/` folders. That's been replaced by the structure above — see `README.md` for the reasoning and how to add new content. If your NAS copy still has the old flat layout, replace it with this new structure rather than merging the two.

See `README.md` at the project root for the full explanation of the structure and how to add new topics/skills.
