/**
 * Main Application Controller
 * Integrates all components and handles the application logic
 */

class PathPlanningApp {
    constructor() {
        this.solver = new EikonalSolver(10, 8);
        this.canvasManager = new CanvasManager('mapCanvas', this.solver);
        this.isCalculating = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupParameterControls();
        this.setupVisualizationControls();
        this.setupCanvasManager();
        this.updateStats();
        this.loadDefaultConfiguration();
    }
    
    setupEventListeners() {
        // Mode buttons
        document.getElementById('startPointBtn').addEventListener('click', () => {
            this.setMode('start');
        });
        
        document.getElementById('endPointBtn').addEventListener('click', () => {
            this.setMode('end');
        });
        
        document.getElementById('obstacleBtn').addEventListener('click', () => {
            this.setMode('obstacle');
        });
        
        // Tool buttons
        document.querySelectorAll('.obstacle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setObstacleTool(e.target.dataset.type || e.target.closest('.obstacle-btn').dataset.type);
            });
        });
        
        // Action buttons
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calculatePath();
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAll();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    setupParameterControls() {
        // Resolution slider
        const resolutionSlider = document.getElementById('resolutionSlider');
        const resolutionValue = document.getElementById('resolutionValue');
        resolutionSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            resolutionValue.textContent = value;
            this.solver.setResolution(value);
            this.canvasManager.draw();
        });
        
        // Obstacle speed slider
        const obstacleSpeedSlider = document.getElementById('obstacleSpeed');
        const obstacleSpeedValue = document.getElementById('obstacleSpeedValue');
        obstacleSpeedSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            obstacleSpeedValue.textContent = value;
            this.solver.setObstacleSpeed(value);
        });
        
        // Smooth radius slider
        const smoothRadiusSlider = document.getElementById('smoothRadius');
        const smoothRadiusValue = document.getElementById('smoothRadiusValue');
        smoothRadiusSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            smoothRadiusValue.textContent = value;
            this.solver.setSmoothRadius(value);
        });
    }
    
    setupVisualizationControls() {
        const checkboxes = [
            'showVelocity',
            'showDistance',
            'showPath'
        ];
        
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            checkbox.addEventListener('change', (e) => {
                this.canvasManager.setVisualization({
                    [id.replace('show', '').toLowerCase()]: e.target.checked
                });
            });
        });
    }
    
    setupCanvasManager() {
        this.canvasManager.setStateChangeCallback(() => {
            this.updateStats();
            this.autoCalculate();
        });
    }
    
    setMode(mode) {
        this.canvasManager.setMode(mode);
        
        // Update UI
        document.querySelectorAll('#startPointBtn, #endPointBtn, #obstacleBtn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (mode === 'start') {
            document.getElementById('startPointBtn').classList.add('active');
        } else if (mode === 'end') {
            document.getElementById('endPointBtn').classList.add('active');
        } else if (mode === 'obstacle') {
            document.getElementById('obstacleBtn').classList.add('active');
        }
    }
    
    setObstacleTool(type) {
        this.canvasManager.setSelectedTool(type);
        
        // Update UI
        document.querySelectorAll('.obstacle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
    }
    
    async calculatePath() {
        if (!this.solver.startPoint || !this.solver.endPoint) {
            this.showNotification('Please set both start and end points', 'warning');
            return;
        }
        
        if (this.isCalculating) return;
        
        this.isCalculating = true;
        this.showLoading(true);
        
        try {
            const result = this.solver.solve(this.solver.startPoint, this.solver.endPoint);
            
            if (result.success) {
                this.canvasManager.draw();
                this.updateStats(result.computationTime);
                this.showNotification('Path calculated successfully!', 'success');
            } else {
                this.showNotification(result.error || 'Failed to calculate path', 'error');
            }
        } catch (error) {
            console.error('Calculation error:', error);
            this.showNotification('Calculation failed: ' + error.message, 'error');
        } finally {
            this.isCalculating = false;
            this.showLoading(false);
        }
    }
    
    autoCalculate() {
        // Debounced auto-calculation
        clearTimeout(this.autoCalculateTimeout);
        this.autoCalculateTimeout = setTimeout(() => {
            if (this.solver.startPoint && this.solver.endPoint) {
                this.calculatePath();
            }
        }, 500);
    }
    
    clearAll() {
        this.canvasManager.clearAll();
        this.updateStats();
    }
    
    updateStats(computationTime = null) {
        const stats = this.solver.getGridInfo();
        const path = this.solver.startPoint && this.solver.endPoint 
            ? this.solver.extractPath(this.solver.startPoint, this.solver.endPoint)
            : [];
        
        document.getElementById('pathLength').textContent = path.length > 0 
            ? path.length.toFixed(2) + ' units'
            : '-';
        
        document.getElementById('computationTime').textContent = computationTime
            ? computationTime.toFixed(2) + ' ms'
            : '-';
        
        document.getElementById('gridPoints').textContent = stats.totalPoints.toLocaleString();
    }
    
    loadDefaultConfiguration() {
        const defaultConfig = {
            width: 10,
            height: 8,
            resolution: 0.1,
            obstacleSpeed: 0.001,
            smoothRadius: 0.3,
            obstacles: [
                { type: 'rectangle', x: 3, y: 2, width: 2, height: 1.5 },
                { type: 'rectangle', x: 6, y: 4, width: 1.5, height: 2 },
                { type: 'circle', cx: 2, cy: 6, radius: 0.8 },
                { type: 'circle', cx: 7, cy: 1.5, radius: 0.6 }
            ],
            startPoint: [0.5, 0.5],
            endPoint: [9.5, 7.5]
        };
        
        this.solver.importConfiguration(defaultConfig);
        this.canvasManager.scaleX = this.canvasManager.canvasWidth / defaultConfig.width;
        this.canvasManager.scaleY = this.canvasManager.canvasHeight / defaultConfig.height;
        this.canvasManager.draw();
        this.updateStats();
        this.calculatePath();
    }
    
    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT') return;
        
        switch (e.key) {
            case '1':
                this.setMode('start');
                break;
            case '2':
                this.setMode('end');
                break;
            case '3':
                this.setMode('obstacle');
                break;
            case 'r':
                this.setObstacleTool('rectangle');
                break;
            case 'c':
                this.setObstacleTool('circle');
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.calculatePath();
                break;
            case 'Escape':
                this.clearAll();
                break;
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: '500',
            zIndex: '1001',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }
    
    exportConfiguration() {
        const config = this.solver.exportConfiguration();
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'path-planning-config.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    importConfiguration(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                this.solver.importConfiguration(config);
                this.canvasManager.scaleX = this.canvasManager.canvasWidth / config.width;
                this.canvasManager.scaleY = this.canvasManager.canvasHeight / config.height;
                this.canvasManager.draw();
                this.updateStats();
                this.calculatePath();
                this.showNotification('Configuration loaded successfully', 'success');
            } catch (error) {
                this.showNotification('Failed to load configuration', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    // Real-time coordinate display
    updateCoordinates(x, y) {
        document.getElementById('coordinates').textContent = `${x.toFixed(2)}, ${y.toFixed(2)}`;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PathPlanningApp();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathPlanningApp;
}