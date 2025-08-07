/**
 * Eikonal PDE Solver for Web
 * Fast Marching Method implementation optimized for JavaScript
 */

class EikonalSolver {
    constructor(width = 10, height = 8) {
        this.width = width;
        this.height = height;
        this.resolution = 0.05; // Fixed optimized resolution
        this.obstacleSpeed = 0.001;
        this.smoothRadius = 0.3;
        
        this.velocityField = [];
        this.distanceField = [];
        this.obstacles = [];
        
        this.startPoint = null;
        this.endPoint = null;
        
        this.nx = 0;
        this.ny = 0;
        this.x = [];
        this.y = [];
        
        this.initializeGrid();
    }
    
    initializeGrid() {
        this.nx = Math.floor(this.width / this.resolution) + 1;
        this.ny = Math.floor(this.height / this.resolution) + 1;
        this.x = Array.from({length: this.nx}, (_, i) => i * this.resolution);
        this.y = Array.from({length: this.ny}, (_, i) => i * this.resolution);
        
        this.velocityField = Array(this.ny).fill().map(() => Array(this.nx).fill(1));
        this.distanceField = Array(this.ny).fill().map(() => Array(this.nx).fill(Infinity));
    }
    
    setResolution(resolution) {
        // Resolution is now fixed at 0.05 for optimal performance
        // This method is kept for backward compatibility but does nothing
        return;
    }
    
    setObstacleSpeed(speed) {
        this.obstacleSpeed = speed;
        this.updateObstacles();
    }
    
    setSmoothRadius(radius) {
        this.smoothRadius = radius;
        this.updateObstacles();
    }
    
    addObstacle(type, params) {
        const obstacle = {
            type: type,
            ...params,
            id: Date.now() + Math.random()
        };
        this.obstacles.push(obstacle);
        this.updateObstacles();
        return obstacle;
    }
    
    removeObstacle(id) {
        this.obstacles = this.obstacles.filter(obs => obs.id !== id);
        this.updateObstacles();
    }
    
    updateObstacle(id, params) {
        const obstacle = this.obstacles.find(obs => obs.id === id);
        if (obstacle) {
            Object.assign(obstacle, params);
            this.updateObstacles();
        }
    }
    
    updateObstacles() {
        // Reset velocity field
        this.velocityField = Array(this.ny).fill().map(() => Array(this.nx).fill(1));
        
        // Apply obstacles
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'rectangle') {
                this.applyRectangleObstacle(obstacle);
            } else if (obstacle.type === 'circle') {
                this.applyCircleObstacle(obstacle);
            }
        }
        
        // Apply smoothing
        this.smoothVelocityField();
    }
    
    applyRectangleObstacle(obstacle) {
        const { x, y, width, height } = obstacle;
        
        for (let i = 0; i < this.ny; i++) {
            for (let j = 0; j < this.nx; j++) {
                const px = this.x[j];
                const py = this.y[i];
                
                if (px >= x && px <= x + width && py >= y && py <= y + height) {
                    this.velocityField[i][j] = this.obstacleSpeed;
                }
            }
        }
    }
    
    applyCircleObstacle(obstacle) {
        const { cx, cy, radius } = obstacle;
        
        for (let i = 0; i < this.ny; i++) {
            for (let j = 0; j < this.nx; j++) {
                const px = this.x[j];
                const py = this.y[i];
                const distance = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
                
                if (distance <= radius) {
                    this.velocityField[i][j] = this.obstacleSpeed;
                } else if (distance <= radius + this.smoothRadius) {
                    const factor = (distance - radius) / this.smoothRadius;
                    this.velocityField[i][j] = Math.max(this.obstacleSpeed, factor);
                }
            }
        }
    }
    
    smoothVelocityField() {
        // Simple Gaussian-like smoothing
        const kernelSize = Math.floor(this.smoothRadius / this.resolution);
        if (kernelSize > 0) {
            const smoothed = JSON.parse(JSON.stringify(this.velocityField));
            
            for (let i = 1; i < this.ny - 1; i++) {
                for (let j = 1; j < this.nx - 1; j++) {
                    let sum = 0;
                    let count = 0;
                    
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            sum += this.velocityField[i + di][j + dj];
                            count++;
                        }
                    }
                    
                    smoothed[i][j] = sum / count;
                }
            }
            
            this.velocityField = smoothed;
        }
    }
    
    solve(start, end) {
        if (!start || !end) return null;
        
        const startTime = performance.now();
        
        // Reset distance field
        this.distanceField = Array(this.ny).fill().map(() => Array(this.nx).fill(Infinity));
        
        const [endX, endY] = end;
        const jEnd = Math.floor(endX / this.resolution);
        const iEnd = Math.floor(endY / this.resolution);
        
        if (iEnd < 0 || iEnd >= this.ny || jEnd < 0 || jEnd >= this.nx) {
            return { success: false, error: "End point out of bounds" };
        }
        
        // Initialize heap with end point
        const heap = [];
        this.distanceField[iEnd][jEnd] = 0;
        heap.push({ distance: 0, i: iEnd, j: jEnd });
        
        const neighbors = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        while (heap.length > 0) {
            // Find minimum distance node
            let minIndex = 0;
            for (let i = 1; i < heap.length; i++) {
                if (heap[i].distance < heap[minIndex].distance) {
                    minIndex = i;
                }
            }
            
            const { distance, i, j } = heap.splice(minIndex, 1)[0];
            
            if (distance > this.distanceField[i][j]) continue;
            
            for (const [di, dj] of neighbors) {
                const ni = i + di;
                const nj = j + dj;
                
                if (ni < 0 || ni >= this.ny || nj < 0 || nj >= this.nx) continue;
                
                let newDistance;
                if (Math.abs(di) + Math.abs(dj) === 1) {
                    // Cardinal direction
                    newDistance = distance + this.resolution / this.velocityField[ni][nj];
                } else {
                    // Diagonal direction
                    newDistance = distance + this.resolution * Math.sqrt(2) / this.velocityField[ni][nj];
                }
                
                if (newDistance < this.distanceField[ni][nj]) {
                    this.distanceField[ni][nj] = newDistance;
                    heap.push({ distance: newDistance, i: ni, j: nj });
                }
            }
        }
        
        const computationTime = performance.now() - startTime;
        
        return {
            success: true,
            distanceField: this.distanceField,
            computationTime: computationTime
        };
    }
    
    extractPath(start, end) {
        if (!start || !end || !this.distanceField) return [];
        
        const [startX, startY] = start;
        const [endX, endY] = end;
        
        let j = Math.floor(startX / this.resolution);
        let i = Math.floor(startY / this.resolution);
        
        if (i < 0 || i >= this.ny || j < 0 || j >= this.nx) {
            return [];
        }
        
        const rawPath = [];
        const maxSteps = this.nx * this.ny;
        let steps = 0;
        
        // Sub-pixel gradient descent for smoother paths
        const neighbors = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        let currentX = startX;
        let currentY = startY;
        
        while (steps < maxSteps) {
            rawPath.push([currentX, currentY]);
            
            // Check if we've reached the end
            const distanceToEnd = Math.sqrt((currentX - endX) ** 2 + (currentY - endY) ** 2);
            if (distanceToEnd < this.resolution * 1.5) {
                rawPath.push([endX, endY]);
                break;
            }
            
            // Sub-pixel gradient descent
            const gridX = Math.floor(currentX / this.resolution);
            const gridY = Math.floor(currentY / this.resolution);
            
            let minDistance = this.distanceField[gridY][gridX];
            let bestDirectionX = 0;
            let bestDirectionY = 0;
            let bestDistance = minDistance;
            
            // Find best gradient direction with sub-pixel precision
            for (const [dy, dx] of neighbors) {
                const ny = gridY + dy;
                const nx = gridX + dx;
                
                if (nx < 0 || nx >= this.nx || ny < 0 || ny >= this.ny) continue;
                
                if (this.distanceField[ny][nx] < bestDistance) {
                    bestDistance = this.distanceField[ny][nx];
                    bestDirectionX = dx;
                    bestDirectionY = dy;
                }
            }
            
            if (bestDirectionX === 0 && bestDirectionY === 0) break;
            
            // Move in gradient direction with adaptive step size
            const stepSize = this.resolution * 0.5; // Smaller steps for smoother path
            currentX += bestDirectionX * stepSize;
            currentY += bestDirectionY * stepSize;
            
            // Keep within bounds
            currentX = Math.max(0, Math.min(this.width - this.resolution, currentX));
            currentY = Math.max(0, Math.min(this.height - this.resolution, currentY));
            
            steps++;
        }
        
        if (rawPath.length < 2) return [];
        
        // Apply path smoothing using Catmull-Rom spline
        return this.smoothPath(rawPath);
    }
    
    smoothPath(rawPath) {
        if (rawPath.length < 3) return rawPath;
        
        const smoothPath = [];
        const smoothingFactor = 0.3; // Adjust for more/less smoothing
        
        // Add the start point
        smoothPath.push(rawPath[0]);
        
        for (let i = 1; i < rawPath.length - 1; i++) {
            const prev = rawPath[i - 1];
            const curr = rawPath[i];
            const next = rawPath[i + 1];
            
            // Catmull-Rom interpolation
            const x = curr[0] + (next[0] - prev[0]) * smoothingFactor;
            const y = curr[1] + (next[1] - prev[1]) * smoothingFactor;
            
            smoothPath.push([x, y]);
        }
        
        // Add the end point
        smoothPath.push(rawPath[rawPath.length - 1]);
        
        return smoothPath;
    }
    
    getGridInfo() {
        return {
            width: this.width,
            height: this.height,
            resolution: this.resolution,
            nx: this.nx,
            ny: this.ny,
            totalPoints: this.nx * this.ny
        };
    }
    
    exportConfiguration() {
        return {
            width: this.width,
            height: this.height,
            resolution: this.resolution,
            obstacleSpeed: this.obstacleSpeed,
            smoothRadius: this.smoothRadius,
            obstacles: this.obstacles,
            startPoint: this.startPoint,
            endPoint: this.endPoint
        };
    }
    
    importConfiguration(config) {
        this.width = config.width || 10;
        this.height = config.height || 8;
        this.resolution = config.resolution || 0.1;
        this.obstacleSpeed = config.obstacleSpeed || 0.001;
        this.smoothRadius = config.smoothRadius || 0.3;
        this.obstacles = config.obstacles || [];
        this.startPoint = config.startPoint;
        this.endPoint = config.endPoint;
        
        this.initializeGrid();
        this.updateObstacles();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EikonalSolver;
} else {
    window.EikonalSolver = EikonalSolver;
}