# Evidence classification

| Class | Examples | Handling |
| --- | --- | --- |
| Public | Published docs, public changelogs | Link to canonical source. |
| Internal | Repo metadata, PR review notes | Limit workspace access and retention. |
| Sensitive | Tokens, private device/browser data, personal health data | Do not collect by default. Require consent, encryption, and a documented purpose. |

The browser prototype persists only manually entered memo notes and retention selections in local storage. Do not put secrets in these notes.