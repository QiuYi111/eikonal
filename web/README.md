# Eikonal PDE Interactive Web Application

A modern, interactive web-based Eikonal PDE path planning application with real-time visualization and obstacle avoidance.

## Features

### 🎯 Interactive Path Planning
- **Real-time path calculation** using Eikonal PDE solver
- **Drag-and-drop obstacle placement** with rectangle and circle tools
- **Interactive start/end point selection**
- **Live path updates** as you modify the environment

### 🎨 Beautiful Visualization
- **Velocity field visualization** showing obstacle proximity effects
- **Distance field visualization** with gradient colors
- **Animated optimal path** with smooth transitions
- **Responsive design** for all screen sizes

### ⚙️ Advanced Controls
- **Adjustable grid resolution** (0.05 - 0.5 units)
- **Obstacle speed factor** for tuning avoidance behavior
- **Smoothing radius** for obstacle edge transitions
- **Toggle visualizations** independently

### 🚀 Performance
- **Optimized JavaScript implementation** of Fast Marching Method
- **Real-time calculation** with progress indicators
- **Efficient grid-based algorithms** for large maps
- **Smooth 60fps animations**

## Quick Start

1. **Open the application**:
   ```bash
   # Serve the web directory
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

2. **Basic usage**:
   - Click "Start Point" tool and click on map to set start
   - Click "End Point" tool and click on map to set end
   - Click "Obstacles" tool to add rectangles or circles
   - Click "Calculate Path" to see the optimal path

## Controls

### Mode Selection
- **Start Point**: Set the starting position
- **End Point**: Set the destination
- **Obstacles**: Add obstacles (rectangles or circles)

### Obstacle Types
- **Rectangle**: Drag from corner to corner
- **Circle**: Click center and drag for radius

### Parameters
- **Grid Resolution**: Controls calculation accuracy
- **Obstacle Speed Factor**: How slow obstacles are (0.001-0.5)
- **Smoothing Radius**: Transition zone around obstacles

### Visualization Options
- **Show Velocity Field**: Color-coded speed map
- **Show Distance Field**: Isoclines from end point
- **Show Optimal Path**: Animated path line

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Select Start Point tool |
| `2` | Select End Point tool |
| `3` | Select Obstacle tool |
| `R` | Rectangle obstacle |
| `C` | Circle obstacle |
| `Enter` / `Space` | Calculate path |
| `Escape` | Clear all |

## Examples

### Simple Obstacle Avoidance
1. Set start point at (0.5, 0.5)
2. Set end point at (9.5, 7.5)
3. Add a rectangle obstacle at (3, 3) with size (2, 1)
4. Calculate path - see the path go around the obstacle

### Complex Environment
1. Add multiple obstacles of different shapes
2. Adjust the obstacle speed factor to see different avoidance behaviors
3. Try different grid resolutions for accuracy vs speed trade-offs

### Performance Testing
1. Increase grid resolution to 0.05
2. Add many obstacles
3. Observe calculation time in statistics

## Technical Details

### Algorithm
- **Eikonal Equation**: Solves ||∇T(x)|| = 1/F(x)
- **Fast Marching Method**: Efficient O(N log N) algorithm
- **Velocity Field**: F(x) = 1 in free space, F(x) = obstacle_speed in obstacles

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile browsers**: Touch support included

### Performance Tips
- **Lower resolution** for better performance with large maps
- **Fewer obstacles** for faster calculations
- **Use rectangles** instead of circles for better performance

## Advanced Usage

### Configuration Import/Export
```javascript
// Export current configuration
const config = app.exportConfiguration();
console.log(JSON.stringify(config, null, 2));

// Import configuration
app.importConfiguration(config);
```

### Custom Solver Parameters
```javascript
// Access solver directly
app.solver.setResolution(0.05);
app.solver.setObstacleSpeed(0.001);
app.solver.setSmoothRadius(0.5);
```

## Troubleshooting

### Path Not Found
- Check if start and end points are set
- Ensure points are within map bounds
- Verify obstacles don't completely block the path

### Performance Issues
- Reduce grid resolution
- Remove unnecessary obstacles
- Use rectangle obstacles instead of circles

### Visualization Problems
- Check if visualization options are enabled
- Try refreshing the page
- Ensure browser supports HTML5 Canvas

## Development

### File Structure
```
web/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js             # Main application logic
├── eikonal-solver.js  # Eikonal PDE solver
├── canvas-manager.js  # Canvas interactions
└── README.md         # This file
```

### Running Locally
```bash
# Simple HTTP server
python -m http.server 8000

# Node.js http-server
npx http-server .

# Live server (VS Code extension)
# Just open index.html with Live Server
```

## API Reference

### EikonalSolver Methods
- `solve(start, end)`: Calculate distance field
- `extractPath(start, end)`: Get optimal path
- `addObstacle(type, params)`: Add obstacle
- `setResolution(value)`: Change grid resolution

### CanvasManager Methods
- `setMode(mode)`: Set interaction mode
- `setSelectedTool(tool)`: Set obstacle tool
- `clearAll()`: Clear everything
- `exportAsImage()`: Save as PNG

## License

MIT License - Feel free to use in your projects!