# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment & Setup

- **Python Environment**: Use `uv` for package management
- **Run Python**: `uv run python <script>`
- **Install Dependencies**: `uv pip install -r requirements.txt`
- **Python Version**: >=3.8

## Project Structure

This is a **dual-purpose codebase** combining:
1. **Python Eikonal PDE solver** for obstacle avoidance path planning
2. **Interactive web application** for real-time path visualization

### Architecture Overview

**Python Backend (`/` root)**:
- `eikonal_path_planning.py`: Core Eikonal PDE solver using Fast Marching Method
- `main.py`: Entry point for Python CLI usage
- `test_eikonal.py`: Unit tests for the solver
- `demo.py`: Demonstration script with sample scenarios

**Web Frontend (`/web/`)**:
- `index.html`: Single-page application with responsive design
- `eikonal-solver.js`: JavaScript implementation of Eikonal solver
- `canvas-manager.js`: Interactive canvas handling and drawing
- `app.js`: Main application logic and event handling
- `styles.css`: Responsive CSS with mobile support

## Key Commands

### Python Development
```bash
# Run Eikonal solver demo
uv run python demo.py

# Run specific test
uv run python -m pytest test_eikonal.py::test_eikonal_solver -v

# Run all tests
uv run python -m pytest test_eikonal.py -v

# Install new dependencies
uv add package_name
```

### Web Development
```bash
# Local development server
python -m http.server 8000
# Then visit http://localhost:8000

# Alternative server options
npx http-server .
python -m http.server 8000 --directory web
```

### GitHub Pages Deployment
```bash
# Web files are already in root for GitHub Pages
# Enable Pages at: https://github.com/QiuYi111/eikonal/settings/pages
# Deployed at: https://qiuyi111.github.io/eikonal
```

## Core Algorithms

**Eikonal Equation**: Solves ||∇T(x)|| = 1/F(x) where F(x) is velocity field
- **Fast Marching Method**: O(N log N) efficient algorithm
- **Velocity Field**: F(x) = 1 in free space, F(x) = obstacle_speed in obstacles
- **Path Extraction**: Gradient descent on distance field T(x)

## File Relationships

- **Python Solver** → `eikonal_path_planning.py` implements core algorithm
- **Web Solver** → `eikonal-solver.js` replicates algorithm in JavaScript
- **Canvas Manager** → `canvas-manager.js` handles interactive drawing
- **Main App** → `app.js` coordinates solver and UI

## Testing Strategy

- **Python Tests**: Focus on algorithm correctness and edge cases
- **Web Testing**: Manual testing via interactive interface
- **Performance**: Monitor calculation time vs grid resolution trade-offs