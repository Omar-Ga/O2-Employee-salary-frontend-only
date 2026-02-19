# PocketBase Running Guide

This guide explains how to start and manage your PocketBase backend server independently.

## 🚀 Quick Start (Running the Server)

PocketBase is located in the `.\pb` directory of your project. To start it, follow these steps:

1.  **Open PowerShell**: In your terminal (VS Code or standalone), ensure you are in the project root: `d:\coding\O2-Employee-salary-frontend-only`.
2.  **Run the Executable**: Execute the following command:
    ```powershell
    .\pb\pocketbase.exe serve
    ```
3.  **Server Status**: You should see output indicating the server is running, typically on `http://127.0.0.1:8090`.

## 🛠️ Accessing the Admin Dashboard

Once the server is running, you can access the dashboard to manage collections, users, and settings:

- **URL**: [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/)
- **Initial Setup**: If this is your first time running it, you will be prompted to create an Admin account (email and password).

## 📂 Key Directories

- `.\pb\pb_data`: Contains your SQLite database and uploaded files. **Do not delete this unless you want to reset everything.**
- `.\pb_migrations`: Contains the schema migrations. These are the "source of truth" for your database structure.

## ⚙️ Common CLI Commands

You can run these commands from the project root using PowerShell:

| Task | Command |
| :--- | :--- |
| **Start Server** | `.\pb\pocketbase.exe serve` |
| **Sync Schema** | `.\pb\pocketbase.exe migrate collections` |
| **Create Admin** | `.\pb\pocketbase.exe admin create your@email.com password` |
| **Update Admin** | `.\pb\pocketbase.exe admin update your@email.com new_password` |
| **Help** | `.\pb\pocketbase.exe --help` |

## ⚠️ Important Notes

- **Keep it Running**: The frontend application requires this server to be running to fetch any data. If you close the terminal running `serve`, the app will show errors.
- **Port Conflict**: If you get an error saying "address already in use", it means another instance of PocketBase (or another service) is already using port 8090.
- **Backups**: Periodically copy the `pb_data` folder if you want to make manual backups of your data.

---
> [!TIP]
> You can run the server in the background in a separate terminal tab so you can continue using the main terminal for frontend development (`npm run dev`).
