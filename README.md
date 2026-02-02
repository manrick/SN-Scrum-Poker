# 🃏 SN Scrum Poker

A real-time story estimation tool for ServiceNow, built as an experiment with the **Build Agent**.

### 🚀 Key Features
* **Real-time Voting:** Powered by WebSockets (AMB).
* **ServiceNow Integration:** Connects directly to the `rm_story` table, which is part of the Agile Development module.
* **Responsive UI:** Separate, mobile-friendly views for Scrum Masters and Users.

### 🛠️ Installation
1. Setup the necessary credential in ServiceNow
2. Open **Studio** in your ServiceNow instance.
3. Select **Import From Source Control**.
4. Paste the Repo URL

### ⚠️ Important Notes
* **Roles:** Don't forget to assign the application roles (`x_250424_sn_scrum8.scrum_poker_scrum_master` or `x_250424_sn_scrum8.scrum_poker_scrum_user`) to your test users.
* **Time Zones:** For the countdown timer to work correctly, **all participating users must be in the same time zone**. This is a current limitation of the logic.

### 🤝 Contributing
This solution is a proof-of-concept. If you find bugs or want to improve the code, feel free to submit a **Pull Request**!
