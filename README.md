# SQL-Ball

SQL-Ball is a football analytics platform that transforms football match data into actionable insights through interactive visualizations and natural language queries. This project was developed as a content project for the **CodeCademy Mastering Generative AI for Developers Bootcamp** held from August to September 2025.

## Overview

SQL-Ball allows users to:
- View and analyze historical match data.
- Filter data by league division (e.g., Premier League, La Liga, Bundesliga).
- Generate visualizations including trends, distribution charts, and performance radar charts.
- Execute natural language queries converted to SQL for retrieving football statistics.

## Architecture & Use Cases

For detailed architectural decisions and design patterns used in this project, please refer to [ARCHITECTURE.md](ARCHITECTURE.md).

**Key Use Cases:**
- **Data Filtering:** Filter match data based on league divisions using unique codes such as:
  - **Premier League (E1)**
  - **La Liga (SP1)**
  - **Bundesliga (G1)**
- **Interactive Visualizations:** Generate charts for goals trends, result distributions, and team performance.
- **Natural Language Querying:** Allow users to enter plain-English queries that are converted into SQL to retrieve relevant insights.
- **Backend Integration:** Support backend data processing (Python-based API) and a frontend built with Svelte and Vite.

## Project Details

- **Frontend:** Built using Svelte and Vite, with visualizations rendered via Chart.js components.
- **Backend:** Python scripts and APIs serve match data and handle data processing.
- **Deployment:** Designed to be deployed to Vercel with separate configuration for the backend. Sensitive files like `backend/.env` should be added to `.gitignore` to protect credentials.
- **Content Project:** This project was created as part of an intensive bootcamp to master generative AI applications in software development.

## Acknowledgements

Thank you for the incredible datasets, this would not be possible without - https://www.football-data.co.uk/data.php

A special thanks to the CodeCademy Mastering Generative AI for Developers Bootcamp for inspiring this project and providing the learning environment that led to its creation. The course and this project in particular were a big learning curve for me and really enjoyed the experience.

## Getting Started

1. **Installation:**
   - Clone the repository.
   - Install dependencies using `npm install` for the frontend.
   - Set up the backend by following the instructions in `backend/setup.sh`.
   - Ensure you have proper environment variables set up (see `.env.example`).

2. **Development:**
   - Start the frontend by running `npm run dev`.
   - For backend development, run the provided scripts in the `backend` directory.

3. **Deployment:**
   - The project is ready for deployment on Vercel. Make sure to configure environment variables on Vercel and exclude sensitive files (like `backend/.env`) from version control.

## Contributing

Contributions are welcome! Please check the issues and submit pull requests for enhancements or bug fixes. For major changes, please open an issue first to discuss the proposed changes.

## License

This project is licensed under the terms described in the [LICENSE](LICENSE) file.
