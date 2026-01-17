# Cognition - ABA Therapy Digital Tools Platform

A suite of digital tools for ABA therapy sessions, starting with a customizable token board system

[![GitHub Actions CI/CD](https://github.com/Megahedron1501/cognition-ci-cd/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Megahedron1501/cognition-ci-cd/actions)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)

**Vercel or other deployment coming soon; for now, run locally using instructions below**

## What is Cognition

Cognition is a digital platform designed to support ABA (Applied Behavior Analysis) Therapy

### Current Features

- Visual token tracking (5-token system)
- Sound feedback when tokens are earned
- Simple reset functionality
- Tablet-friendly interface

## Quick Start - For Windows Users (Powershell)

1. **Download Node.js** from [nodejs.org](https://nodejs.org/)
    - Click the "LTS" version (Recommended for most users)\
    - Run the installer (Just click Next, Next, Next)

2. **Verify installation** (Open PowerShell as Admin):
    ```powershell
    # Check Node.js version
    node --version

    # Check npm version
    npm --version
    ```

3. **Clone and Run the Project**
```Powershell
# Clone the repository
git clone https://github.com/Megahedron1501/cognition-ci-cd.git

#Navigate into the project
cd cognition-ci-cd

# Install dependencies
npm install
```
The app should automatically open in your browser at `http://localhost:3000

## 📁 Project Structure
```
cognition/
├── public/
│   └── sounds/          # Sound effects (coin.mp3)
├── src/
│   ├── App.tsx          # Main token board component
│   ├── App.css          # Styles (currently using inline styles)
│   └── react-app-env.d.ts  # TypeScript declarations
└── package.json
```

## 🔮 Roadmap

### Planned Features
- [ ] Customizable token counts (not just 5)
- [ ] Save progress across sessions
- [ ] Multiple student profiles
- [ ] Different reward types and images
- [ ] Data tracking and reports for BCBAs
- [ ] Timer integration
- [ ] Different visual themes
- [ ] Sound on/off toggle

## 👥 For BCBAs and Therapists

This tool is designed to complement traditional ABA token systems. The digital format offers:
- Consistent visual presentation
- Immediate feedback
- Easy reset between activities
- Potential for data collection (coming soon)

## 🤝 Contributing

This is a learning project! If you're interested in helping develop tools for autism therapy, feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 💬 Contact

- **GitHub**: [@Megahedron1501](https://github.com/Megahedron1501)
- **Project Link**: https://github.com/Megahedron1501/cognition-ci-cd