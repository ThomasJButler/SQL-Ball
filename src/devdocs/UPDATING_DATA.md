# Guide: Updating Match Data in Supabase

This guide outlines the process for adding new Premier League match data to the Supabase database, typically done at the start of a new season or periodically for the current season.

## Adding a New Season's Historical Data

This process involves importing data from a CSV file for a completed season.

1.  **Obtain CSV Data:** Get the CSV file containing the match data for the new season (e.g., `2025-2026.csv`). Ensure it follows a similar structure to previous seasons.
2.  **Upload to Supabase:**
    *   In the Supabase dashboard, go to `Table Editor`.
    *   Click `+ New Table`.
    *   **Crucially**, choose to `Import data from a spreadsheet`.
    *   Upload your CSV file.
    *   Name the table after the season (e.g., `2025-2026`). **Make sure it's created in the `public` schema.**
    *   Supabase will attempt to infer column types. Review them carefully. It's common for numeric columns like goals, shots, cards to be initially imported as `text` or `int8` (bigint). This is okay, as we handle casting in the SQL script.
    *   Complete the import process.
3.  **Add Season to `seasons` Table:**
    *   Go to the `public.seasons` table in the Table Editor.
    *   Click `+ Insert row`.
    *   Fill in the `name` (e.g., `2025-2026`), `start_date`, `end_date`, and set `is_current` appropriately (usually `false` for historical data).
    *   Save the row.
    *   **Copy the newly generated `id` (UUID) for this season.** You'll need it in the next step.
4.  **Prepare SQL Import Script:**
    *   Find an existing `INSERT` script from a previous season import (like the ones we developed).
    *   **Adapt the script:**
        *   Change the `FROM public."<old-season-table>"` clause to use your new table name (e.g., `FROM public."2025-2026" as src`).
        *   Update the `season_id` UUID in the `SELECT` list to the new UUID you copied in the previous step.
        *   **Carefully review the column list and casts:** Compare the column names and data types in your *new* source table (`public."2025-2026"`) with the target `public.matches` table schema and the script's `SELECT` list.
        *   Adjust `::int`, `::bigint`, `::text`, `::double precision`, `::timestamp` casts as needed based on the *source* table's actual data types for this specific season.
        *   Add or remove `NULLIF(src."ColumnName", '-')::` casts if columns like `AHh` or `AHCh` are `text` in the source and might contain hyphens.
        *   Ensure any columns *missing* from this season's source CSV but present in `public.matches` are correctly set to `NULL` in the appropriate `SELECT` list position.
5.  **Run SQL Script:**
    *   Go to the `SQL Editor` in the Supabase dashboard.
    *   Paste your adapted `INSERT` script.
    *   Run the script.
    *   Address any errors (usually type mismatches or constraint violations) by correcting the script and re-running.
6.  **Verify Data:** Briefly check the `public.matches` table to ensure the new season's data appears correctly. Filter by the `season_id` or check the row count.
7.  **(Optional) Clean Up:** Once you've confirmed the data is successfully in the `matches` table, you can drop the temporary season table (`DROP TABLE public."2025-2026";`) using the SQL Editor to save space.

## Updating Current Season Matches

If you need to add results for matches as they happen during the *current* season:

*   **Manual Entry:** For occasional updates, you can directly use the Supabase Table Editor to add or modify rows in the `public.matches` table.
*   **API/Script:** If you have an external data source or API providing live results, you would typically write a script (e.g., a Node.js script using the `supabase-js` library, like the functions in `src/lib/supabase.ts`) to:
    *   Fetch the latest results from the source.
    *   Query the `public.matches` table to find matches without results (`WHERE result IS NULL`).
    *   Update the corresponding rows in `public.matches` with the final scores, results, and potentially other stats using the `supabase.from('matches').update({...}).eq('id', matchId)` method.
    *   Alternatively, use `insertMatch` from `src/lib/supabase.ts` if adding entirely new match fixtures.