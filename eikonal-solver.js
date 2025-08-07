/**
 * Eikonal PDE Solver for Web
 * Fast Marching Method implementation optimized for JavaScript
 */

class EikonalSolver {
    constructor(width = 10, height = 8) {
        this.width = width;
        this.height = height;
        this.resolution = 0.1;
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
        this.resolution = resolution;
        this.initializeGrid();
        this.updateObstacles();
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
        
        const path = [];
        const maxSteps = this.nx * this.ny;
        let steps = 0;
        
        const neighbors = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        while (steps < maxSteps) {
            path.push([this.x[j], this.y[i]]);
            
            // Check if reached end
            const endJ = Math.floor(endX / this.resolution);
            const endI = Math.floor(endY / this.resolution);
            
            if (Math.abs(i - endI) <= 1 && Math.abs(j - endJ) <= 1) {
                path.push([endX, endY]);
                break;
            }
            
            // Find gradient descent direction
            let minDistance = this.distanceField[i][j];
            let nextI = i, nextJ = j;
            
            for (const [di, dj] of neighbors) {
                const ni = i + di;
                const nj = j + dj;
                
                if (ni < 0 || ni >= this.ny || nj < 0 || nj >= this.nx) continue;
                
                if (this.distanceField[ni][nj] < minDistance) {
                    minDistance = this.distanceField[ni][nj];
                    nextI = ni;
                    nextJ = nj;
                }
            }
            
            if (nextI === i && nextJ === j) break;
            
            i = nextI;
            j = nextJ;
            steps++;
        }
        
        return path;
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