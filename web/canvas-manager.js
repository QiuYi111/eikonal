/**
 * Canvas Manager for Interactive Path Planning
 * Handles all canvas interactions, drawing, and user input
 */

class CanvasManager {
    constructor(canvasId, solver) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.solver = solver;
        
        // Canvas dimensions
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        this.scaleX = this.canvasWidth / solver.width;
        this.scaleY = this.canvasHeight / solver.height;
        
        // Interaction state
        this.mode = 'obstacle'; // 'start', 'end', 'obstacle', 'drag'
        this.selectedTool = 'rectangle';
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.selectedObstacle = null;
        this.isCreating = false;
        this.createStart = null;
        
        // Visual elements
        this.visualization = {
            showVelocity: true,
            showDistance: false,
            showPath: true
        };
        
        this.colors = {
            background: '#f8f9fa',
            grid: '#e9ecef',
            obstacles: '#6c757d',
            start: '#28a745',
            end: '#dc3545',
            path: '#667eea',
            velocity: ['#e3f2fd', '#1976d2'],
            distance: ['#fff3e0', '#ff6f00']
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.draw();
    }
    
    setupCanvas() {
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.ctx.imageSmoothingEnabled = true;
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX / this.scaleX,
            y: (e.clientY - rect.top) * scaleY / this.scaleY
        };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX / this.scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY / this.scaleY
        };
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        this.handleInteraction('down', pos, e);
    }
    
    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        this.handleInteraction('move', pos, e);
    }
    
    handleMouseUp(e) {
        const pos = this.getMousePos(e);
        this.handleInteraction('up', pos, e);
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.handleInteraction('down', pos, e);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.handleInteraction('move', pos, e);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        const pos = this.getMousePos({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
        this.handleInteraction('up', pos, e);
    }
    
    handleInteraction(type, pos, event) {
        switch (this.mode) {
            case 'start':
                this.handleStartPoint(type, pos);
                break;
            case 'end':
                this.handleEndPoint(type, pos);
                break;
            case 'obstacle':
                this.handleObstacle(type, pos);
                break;
            case 'drag':
                this.handleDrag(type, pos);
                break;
        }
    }
    
    handleStartPoint(type, pos) {
        if (type === 'down') {
            this.solver.startPoint = [pos.x, pos.y];
            this.draw();
            this.onStateChange();
        }
    }
    
    handleEndPoint(type, pos) {
        if (type === 'down') {
            this.solver.endPoint = [pos.x, pos.y];
            this.draw();
            this.onStateChange();
        }
    }
    
    handleObstacle(type, pos) {
        if (this.selectedTool === 'rectangle') {
            this.handleRectangleObstacle(type, pos);
        } else if (this.selectedTool === 'circle') {
            this.handleCircleObstacle(type, pos);
        }
    }
    
    handleRectangleObstacle(type, pos) {
        if (type === 'down') {
            this.isCreating = true;
            this.createStart = pos;
        } else if (type === 'move' && this.isCreating) {
            this.draw();
            this.drawRectanglePreview(this.createStart, pos);
        } else if (type === 'up' && this.isCreating) {
            const width = Math.abs(pos.x - this.createStart.x);
            const height = Math.abs(pos.y - this.createStart.y);
            const x = Math.min(pos.x, this.createStart.x);
            const y = Math.min(pos.y, this.createStart.y);
            
            if (width > 0.1 && height > 0.1) {
                this.solver.addObstacle('rectangle', { x, y, width, height });
            }
            
            this.isCreating = false;
            this.createStart = null;
            this.draw();
            this.onStateChange();
        }
    }
    
    handleCircleObstacle(type, pos) {
        if (type === 'down') {
            this.isCreating = true;
            this.createStart = pos;
        } else if (type === 'move' && this.isCreating) {
            this.draw();
            const radius = Math.sqrt((pos.x - this.createStart.x) ** 2 + (pos.y - this.createStart.y) ** 2);
            this.drawCirclePreview(this.createStart, radius);
        } else if (type === 'up' && this.isCreating) {
            const radius = Math.sqrt((pos.x - this.createStart.x) ** 2 + (pos.y - this.createStart.y) ** 2);
            
            if (radius > 0.1) {
                this.solver.addObstacle('circle', { cx: this.createStart.x, cy: this.createStart.y, radius });
            }
            
            this.isCreating = false;
            this.createStart = null;
            this.draw();
            this.onStateChange();
        }
    }
    
    handleDrag(type, pos) {
        if (type === 'down') {
            const obstacle = this.findObstacleAt(pos);
            if (obstacle) {
                this.selectedObstacle = obstacle;
                this.isDragging = true;
                this.canvas.style.cursor = 'grabbing';
            }
        } else if (type === 'move' && this.isDragging && this.selectedObstacle) {
            this.updateObstaclePosition(this.selectedObstacle, pos);
            this.draw();
        } else if (type === 'up') {
            this.isDragging = false;
            this.selectedObstacle = null;
            this.canvas.style.cursor = 'crosshair';
        }
    }
    
    findObstacleAt(pos) {
        for (const obstacle of this.solver.obstacles) {
            if (obstacle.type === 'rectangle') {
                if (pos.x >= obstacle.x && pos.x <= obstacle.x + obstacle.width &&
                    pos.y >= obstacle.y && pos.y <= obstacle.y + obstacle.height) {
                    return obstacle;
                }
            } else if (obstacle.type === 'circle') {
                const distance = Math.sqrt((pos.x - obstacle.cx) ** 2 + (pos.y - obstacle.cy) ** 2);
                if (distance <= obstacle.radius) {
                    return obstacle;
                }
            }
        }
        return null;
    }
    
    updateObstaclePosition(obstacle, pos) {
        if (obstacle.type === 'rectangle') {
            obstacle.x = pos.x - obstacle.width / 2;
            obstacle.y = pos.y - obstacle.height / 2;
        } else if (obstacle.type === 'circle') {
            obstacle.cx = pos.x;
            obstacle.cy = pos.y;
        }
        this.solver.updateObstacles();
    }
    
    draw() {
        this.clearCanvas();
        this.drawGrid();
        
        if (this.visualization.showVelocity) {
            this.drawVelocityField();
        }
        
        if (this.visualization.showDistance && this.solver.distanceField.length > 0) {
            this.drawDistanceField();
        }
        
        this.drawObstacles();
        this.drawPoints();
        
        if (this.visualization.showPath && this.solver.startPoint && this.solver.endPoint) {
            this.drawPath();
        }
        
        if (this.isCreating && this.createStart) {
            this.drawCreationPreview();
        }
    }
    
    clearCanvas() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= this.solver.width; x += 1) {
            const canvasX = x * this.scaleX;
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.canvasHeight);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.solver.height; y += 1) {
            const canvasY = y * this.scaleY;
            this.ctx.beginPath();
            this.ctx.moveTo(0, canvasY);
            this.ctx.lineTo(this.canvasWidth, canvasY);
            this.ctx.stroke();
        }
    }
    
    drawVelocityField() {
        const velocityField = this.solver.velocityField;
        if (!velocityField || velocityField.length === 0) return;
        
        const cellWidth = this.scaleX * this.solver.resolution;
        const cellHeight = this.scaleY * this.solver.resolution;
        
        for (let i = 0; i < velocityField.length; i++) {
            for (let j = 0; j < velocityField[i].length; j++) {
                const value = velocityField[i][j];
                const intensity = (value - this.solver.obstacleSpeed) / (1 - this.solver.obstacleSpeed);
                
                const r = Math.floor(230 - intensity * 100);
                const g = Math.floor(240 - intensity * 120);
                const b = Math.floor(250 - intensity * 50);
                
                this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }
    
    drawDistanceField() {
        const distanceField = this.solver.distanceField;
        if (!distanceField || distanceField.length === 0) return;
        
        const maxDistance = Math.max(...distanceField.flat().filter(d => d < Infinity));
        const cellWidth = this.scaleX * this.solver.resolution;
        const cellHeight = this.scaleY * this.solver.resolution;
        
        for (let i = 0; i < distanceField.length; i++) {
            for (let j = 0; j < distanceField[i].length; j++) {
                const value = distanceField[i][j];
                if (value === Infinity) continue;
                
                const intensity = value / maxDistance;
                const alpha = 0.3 + 0.7 * intensity;
                
                this.ctx.fillStyle = `rgba(255, 111, 0, ${alpha})`;
                this.ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }
    
    drawObstacles() {
        this.ctx.fillStyle = this.colors.obstacles;
        this.ctx.strokeStyle = this.colors.obstacles;
        this.ctx.lineWidth = 2;
        
        for (const obstacle of this.solver.obstacles) {
            if (obstacle.type === 'rectangle') {
                const x = obstacle.x * this.scaleX;
                const y = obstacle.y * this.scaleY;
                const width = obstacle.width * this.scaleX;
                const height = obstacle.height * this.scaleY;
                
                this.ctx.fillRect(x, y, width, height);
                this.ctx.strokeRect(x, y, width, height);
            } else if (obstacle.type === 'circle') {
                const x = obstacle.cx * this.scaleX;
                const y = obstacle.cy * this.scaleY;
                const radius = obstacle.radius * Math.min(this.scaleX, this.scaleY);
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
            }
        }
    }
    
    drawPoints() {
        // Draw start point
        if (this.solver.startPoint) {
            const [x, y] = this.solver.startPoint;
            const canvasX = x * this.scaleX;
            const canvasY = y * this.scaleY;
            
            this.ctx.fillStyle = this.colors.start;
            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('S', canvasX, canvasY + 4);
        }
        
        // Draw end point
        if (this.solver.endPoint) {
            const [x, y] = this.solver.endPoint;
            const canvasX = x * this.scaleX;
            const canvasY = y * this.scaleY;
            
            this.ctx.fillStyle = this.colors.end;
            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('E', canvasX, canvasY + 4);
        }
    }
    
    drawPath() {
        const path = this.solver.extractPath(this.solver.startPoint, this.solver.endPoint);
        if (path.length === 0) return;
        
        this.ctx.strokeStyle = this.colors.path;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const [x, y] = path[i];
            const canvasX = x * this.scaleX;
            const canvasY = y * this.scaleY;
            
            if (i === 0) {
                this.ctx.moveTo(canvasX, canvasY);
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    drawRectanglePreview(start, current) {
        const x = Math.min(start.x, current.x) * this.scaleX;
        const y = Math.min(start.y, current.y) * this.scaleY;
        const width = Math.abs(current.x - start.x) * this.scaleX;
        const height = Math.abs(current.y - start.y) * this.scaleY;
        
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([3, 3]);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);
    }
    
    drawCirclePreview(center, radius) {
        const x = center.x * this.scaleX;
        const y = center.y * this.scaleY;
        const r = radius * Math.min(this.scaleX, this.scaleY);
        
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([3, 3]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    clearAll() {
        this.solver.obstacles = [];
        this.solver.startPoint = null;
        this.solver.endPoint = null;
        this.solver.distanceField = [];
        this.draw();
        this.onStateChange();
    }
    
    exportAsImage() {
        const link = document.createElement('a');
        link.download = 'eikonal-path-planning.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    exportConfiguration() {
        return this.solver.exportConfiguration();
    }
    
    importConfiguration(config) {
        this.solver.importConfiguration(config);
        this.scaleX = this.canvasWidth / this.solver.width;
        this.scaleY = this.canvasHeight / this.solver.height;
        this.draw();
        this.onStateChange();
    }
    
    // Event handlers
    onStateChange() {
        // Override this method to handle state changes
        if (typeof this.stateChangeCallback === 'function') {
            this.stateChangeCallback();
        }
    }
    
    setStateChangeCallback(callback) {
        this.stateChangeCallback = callback;
    }
    
    // Mode setters
    setMode(mode) {
        this.mode = mode;
        this.canvas.style.cursor = mode === 'drag' ? 'grab' : 'crosshair';
    }
    
    setSelectedTool(tool) {
        this.selectedTool = tool;
    }
    
    setVisualization(settings) {
        this.visualization = { ...this.visualization, ...settings };
        this.draw();
    }
    
    // Utility functions
    worldToCanvas(x, y) {
        return {
            x: x * this.scaleX,
            y: y * this.scaleY
        };
    }
    
    canvasToWorld(x, y) {
        return {
            x: x / this.scaleX,
            y: y / this.scaleY
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasManager;
} else {
    window.CanvasManager = CanvasManager;
}