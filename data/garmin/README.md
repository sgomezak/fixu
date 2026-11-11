# Garmin data

Written by the **Garmin weekly report** routine (Sundays 21:39, Madrid) from Garmin Connect, the same files it uploads to the Garmin weekly report artifact:

- `daily.csv`: one row per day (steps, heart rate, stress, Body Battery, sleep, HRV)
- `activities.csv`: one row per recorded activity

The files hold the full history; each run replaces them. The app reads them on the server only.
