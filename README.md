🃏 SN Scrum Poker
A real-time story estimation tool for ServiceNow, built as an experiment with the Build Agent.

🚀 Key Features
Real-time Voting: Powered by WebSockets (AMB).

ServiceNow Integration: Connects directly to the rm_story table, which is part of the Agile Development module.

Responsive UI: Separate, mobile-friendly views for Scrum Masters and Users.

🛠️ Installation
Open Studio in your ServiceNow instance.

Select Import From Source Control.

Paste this Repo URL: [INSERT_YOUR_GITHUB_REPO_URL_HERE]

⚠️ Important Notes
Roles: Don't forget to assign the app roles (x_250424_sn_scrum8.scrum_poker_scrum_master, x_250424_sn_scrum8.scrum_poker_scrum_user) to your test users before trying the app.

Time Zones: For the countdown timer to work correctly, all users must be in the same time zone. This is a known limitation of the current version.

🤝 Contributing
The solution is a proof-of-concept. If you find bugs or want to improve the code, feel free to submit a Pull Request!
