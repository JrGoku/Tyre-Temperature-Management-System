# Truck & Bus Radial Tire Telemetry Simulator

A professional offline engineering dashboard for demonstrating a simulated ESP32-based tire telemetry system for truck and bus radial tires.

## Overview

This project simulates a truck chassis with four wheel nodes:

- Front Left (FL)
- Front Right (FR)
- Rear Left (RL)
- Rear Right (RR)

Each wheel node simulates:

- Tire temperature
- Tire pressure
- Efficiency Score
- Wear-Life Score
- Retread Risk Score

The dashboard is designed as a final-year engineering project demo for presentations, conferences, and academic reviews.

## Features

- Modern industrial dark dashboard theme
- Clickable truck wheel selector
- Live simulated telemetry updates every 1.5 seconds
- Temperature and pressure readouts
- Efficiency, wear-life, retread-risk, and fleet-health scores
- Heat slider with Heat Up, Cool Down, and Reset controls
- Professional SVG truck illustration
- SVG hardware architecture diagram
- Animated sensor pulses and wireless data flow
- Live temperature history chart using HTML Canvas
- Fully offline and self-contained
- No framework dependencies
- Responsive layout for desktop, tablet, and mobile

## Project Structure

```text
truck-tire-telemetry-dashboard/
├── index.html
├── style.css
├── script.js
├── README.md
├── LICENSE
└── assets/
    ├── truck.svg
    ├── esp32.svg
    ├── battery.svg
    ├── temperature.svg
    ├── pressure.svg
    └── receiver.svg
```

## Installation

No installation is required. This is a static website.

## Local Execution

### Option 1: Open directly
1. Download or clone the project folder.
2. Double-click `index.html`.
3. Open it in a modern browser like Chrome, Edge, or Firefox.

### Option 2: Use a local server
If you prefer, you can serve the folder locally with any static server, but it is not required.

## GitHub Pages Deployment

This project is fully compatible with GitHub Pages.

### Steps
1. Create a GitHub repository.
2. Upload all files into the repository root.
3. Make sure `index.html` is directly in the root folder.
4. Commit and push the files.
5. In GitHub, go to **Settings → Pages**.
6. Under **Build and deployment**, set:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/root`
7. Click **Save**.
8. Wait a few minutes for GitHub Pages to deploy the site.
9. Open the public URL shown in the Pages settings.

### Typical URL format
```text
https://your-username.github.io/your-repository-name/
```

## Future Improvements

- Add real ESP32 live data input
- Add MQTT or WebSocket integration
- Add fault detection and warnings
- Add historical data export to CSV
- Add route-level fleet analytics
- Add multiple truck simulation mode
- Add alert notifications and sound indicators

## License

You may include a license file such as MIT if you want to make the code reusable.

If no license file is included, treat the project as "all rights reserved" until you specify otherwise.
