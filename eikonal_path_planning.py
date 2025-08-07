#!/usr/bin/env python3
"""
Eikonal PDE 避障路径规划可视化
使用 Fast Marching Method (FMM) 求解 Eikonal 方程
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle
import heapq
from typing import Tuple, List, Optional
import json


class EikonalPathPlanner:
    """Eikonal PDE 路径规划器"""
    
    def __init__(self, width: float = 10.0, height: float = 10.0, resolution: float = 0.1):
        """
        初始化路径规划器
        
        Args:
            width: 地图宽度
            height: 地图高度
            resolution: 网格分辨率
        """
        self.width = width
        self.height = height
        self.resolution = resolution
        
        # 计算网格大小
        self.nx = int(width / resolution) + 1
        self.ny = int(height / resolution) + 1
        
        # 初始化网格坐标
        self.x = np.linspace(0, width, self.nx)
        self.y = np.linspace(0, height, self.ny)
        self.X, self.Y = np.meshgrid(self.x, self.y)
        
        # 速度场 (障碍物附近速度极小)
        self.velocity_field = np.ones((self.ny, self.nx))
        
        # 障碍物列表
        self.obstacles = []
        
        # 距离场
        self.distance_field = None
        
    def add_obstacle(self, obstacle_type: str, **kwargs):
        """添加障碍物"""
        obstacle = {'type': obstacle_type, **kwargs}
        self.obstacles.append(obstacle)
        
    def _calculate_velocity_field(self):
        """计算速度场 - 障碍物附近速度极小"""
        # 重置速度场
        self.velocity_field = np.ones((self.ny, self.nx))
        
        # 设置障碍物区域速度极小
        for obstacle in self.obstacles:
            if obstacle['type'] == 'rectangle':
                self._add_rectangle_obstacle(obstacle)
            elif obstacle['type'] == 'circle':
                self._add_circle_obstacle(obstacle)
        
        # 添加平滑过渡区域
        self._smooth_velocity_field()
        
    def _add_rectangle_obstacle(self, obstacle: dict):
        """添加矩形障碍物"""
        x, y, w, h = obstacle['x'], obstacle['y'], obstacle['width'], obstacle['height']
        
        # 找到对应的网格索引
        x_min = max(0, int(x / self.resolution))
        x_max = min(self.nx, int((x + w) / self.resolution) + 1)
        y_min = max(0, int(y / self.resolution))
        y_max = min(self.ny, int((y + h) / self.resolution) + 1)
        
        # 障碍物内部速度为极小值
        self.velocity_field[y_min:y_max, x_min:x_max] = 0.001
        
    def _add_circle_obstacle(self, obstacle: dict):
        """添加圆形障碍物"""
        cx, cy, r = obstacle['cx'], obstacle['cy'], obstacle['radius']
        
        # 计算到圆心的距离
        for i in range(self.ny):
            for j in range(self.nx):
                dist = np.sqrt((self.x[j] - cx)**2 + (self.y[i] - cy)**2)
                if dist <= r:
                    # 障碍物内部速度极小
                    self.velocity_field[i, j] = 0.001
                elif dist <= r + 0.5:
                    # 障碍物边缘平滑过渡
                    factor = (dist - r) / 0.5
                    self.velocity_field[i, j] = max(0.001, factor * self.velocity_field[i, j])
    
    def _smooth_velocity_field(self, smooth_radius: float = 0.3):
        """平滑速度场"""
        # 简单的平滑滤波
        kernel_size = int(smooth_radius / self.resolution)
        if kernel_size > 0:
            from scipy.ndimage import gaussian_filter
            self.velocity_field = gaussian_filter(self.velocity_field, sigma=kernel_size)
    
    def solve_eikonal(self, start: Tuple[float, float], goal: Tuple[float, float]) -> np.ndarray:
        """
        使用 Fast Marching Method 求解 Eikonal 方程
        
        Args:
            start: 起点坐标 (x, y)
            goal: 目标点坐标 (x, y)
            
        Returns:
            距离场数组
        """
        # 计算速度场
        self._calculate_velocity_field()
        
        # 初始化距离场
        distance = np.full((self.ny, self.nx), np.inf)
        
        # 设置目标点为源点（反向求解）
        goal_idx = (int(goal[1] / self.resolution), int(goal[0] / self.resolution))
        if 0 <= goal_idx[0] < self.ny and 0 <= goal_idx[1] < self.nx:
            distance[goal_idx] = 0
            
            # 使用 Dijkstra 算法近似 FMM
            queue = [(0, goal_idx)]
            
            # 8方向邻居
            neighbors = [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]
            
            while queue:
                dist, (i, j) = heapq.heappop(queue)
                
                if dist > distance[i, j]:
                    continue
                
                for di, dj in neighbors:
                    ni, nj = i + di, j + dj
                    
                    if 0 <= ni < self.ny and 0 <= nj < self.nx:
                        # 计算新距离
                        if abs(di) + abs(dj) == 1:  # 直向
                            new_dist = dist + self.resolution / self.velocity_field[ni, nj]
                        else:  # 斜向
                            new_dist = dist + self.resolution * np.sqrt(2) / self.velocity_field[ni, nj]
                        
                        if new_dist < distance[ni, nj]:
                            distance[ni, nj] = new_dist
                            heapq.heappush(queue, (new_dist, (ni, nj)))
        
        self.distance_field = distance
        return distance
    
    def extract_path(self, start: Tuple[float, float], goal: Tuple[float, float]) -> List[Tuple[float, float]]:
        """从距离场提取最优路径"""
        if self.distance_field is None:
            return []
            
        start_idx = (int(start[1] / self.resolution), int(start[0] / self.resolution))
        
        if not (0 <= start_idx[0] < self.ny and 0 <= start_idx[1] < self.nx):
            return []
        
        path = []
        current = start_idx
        
        # 8方向邻居
        neighbors = [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]
        
        max_steps = self.nx * self.ny  # 防止无限循环
        steps = 0
        
        while steps < max_steps:
            path.append((current[1] * self.resolution, current[0] * self.resolution))
            
            # 检查是否到达目标
            if np.abs(current[0] - int(goal[1] / self.resolution)) <= 1 and \
               np.abs(current[1] - int(goal[0] / self.resolution)) <= 1:
                break
            
            # 寻找梯度下降方向
            min_dist = self.distance_field[current]
            next_pos = current
            
            for di, dj in neighbors:
                ni, nj = current[0] + di, current[1] + dj
                if 0 <= ni < self.ny and 0 <= nj < self.nx:
                    if self.distance_field[ni, nj] < min_dist:
                        min_dist = self.distance_field[ni, nj]
                        next_pos = (ni, nj)
            
            if next_pos == current:  # 达到局部最小值
                break
                
            current = next_pos
            steps += 1
        
        # 添加终点
        path.append(goal)
        
        return path
    
    def visualize(self, start: Tuple[float, float], goal: Tuple[float, float], 
                  save_path: Optional[str] = None):
        """可视化路径规划结果"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Eikonal PDE 避障路径规划', fontsize=16)
        
        # 1. 速度场
        im1 = ax1.imshow(self.velocity_field, extent=[0, self.width, 0, self.height], 
                        origin='lower', cmap='viridis')
        ax1.set_title('速度场 (障碍物附近速度极小)')
        ax1.set_xlabel('X')
        ax1.set_ylabel('Y')
        plt.colorbar(im1, ax=ax1, label='速度')
        
        # 绘制障碍物
        for obstacle in self.obstacles:
            if obstacle['type'] == 'rectangle':
                rect = Rectangle((obstacle['x'], obstacle['y']), 
                               obstacle['width'], obstacle['height'], 
                               fill=False, edgecolor='red', linewidth=2)
                ax1.add_patch(rect)
            elif obstacle['type'] == 'circle':
                circle = Circle((obstacle['cx'], obstacle['cy']), obstacle['radius'],
                              fill=False, edgecolor='red', linewidth=2)
                ax1.add_patch(circle)
        
        # 2. 距离场
        if self.distance_field is not None:
            im2 = ax2.imshow(self.distance_field, extent=[0, self.width, 0, self.height], 
                            origin='lower', cmap='plasma')
            ax2.set_title('距离场 (从目标点开始)')
            ax2.set_xlabel('X')
            ax2.set_ylabel('Y')
            plt.colorbar(im2, ax=ax2, label='距离')
        
        # 3. 路径可视化
        ax3.imshow(self.velocity_field, extent=[0, self.width, 0, self.height], 
                  origin='lower', cmap='viridis', alpha=0.7)
        ax3.set_title('最优路径')
        ax3.set_xlabel('X')
        ax3.set_ylabel('Y')
        
        # 绘制障碍物
        for obstacle in self.obstacles:
            if obstacle['type'] == 'rectangle':
                rect = Rectangle((obstacle['x'], obstacle['y']), 
                               obstacle['width'], obstacle['height'], 
                               fill=True, facecolor='red', alpha=0.5)
                ax3.add_patch(rect)
            elif obstacle['type'] == 'circle':
                circle = Circle((obstacle['cx'], obstacle['cy']), obstacle['radius'],
                              fill=True, facecolor='red', alpha=0.5)
                ax3.add_patch(circle)
        
        # 绘制起点和终点
        ax3.plot(start[0], start[1], 'go', markersize=10, label='起点')
        ax3.plot(goal[0], goal[1], 'ro', markersize=10, label='终点')
        
        # 绘制路径
        if self.distance_field is not None:
            path = self.extract_path(start, goal)
            if path:
                path_x, path_y = zip(*path)
                ax3.plot(path_x, path_y, 'r-', linewidth=2, label='最优路径')
        
        ax3.legend()
        ax3.set_xlim(0, self.width)
        ax3.set_ylim(0, self.height)
        
        # 4. 3D 距离场
        if self.distance_field is not None:
            ax4 = fig.add_subplot(224, projection='3d')
            surf = ax4.plot_surface(self.X, self.Y, self.distance_field, 
                                   cmap='plasma', alpha=0.8)
            ax4.set_title('3D 距离场')
            ax4.set_xlabel('X')
            ax4.set_ylabel('Y')
            ax4.set_zlabel('距离')
            plt.colorbar(surf, ax=ax4, shrink=0.5, aspect=5, label='距离')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        
        plt.show()


def demo_path_planning():
    """演示路径规划"""
    # 创建路径规划器
    planner = EikonalPathPlanner(width=10, height=8, resolution=0.1)
    
    # 添加障碍物
    planner.add_obstacle('rectangle', x=3, y=2, width=2, height=1.5)
    planner.add_obstacle('rectangle', x=6, y=4, width=1.5, height=2)
    planner.add_obstacle('circle', cx=2, cy=6, radius=0.8)
    planner.add_obstacle('circle', cx=7, cy=1.5, radius=0.6)
    
    # 设置起点和终点
    start = (0.5, 0.5)
    goal = (9.5, 7.5)
    
    # 求解Eikonal方程
    print("求解Eikonal方程...")
    planner.solve_eikonal(start, goal)
    
    # 可视化结果
    print("生成可视化...")
    planner.visualize(start, goal, save_path='eikonal_path_planning.png')
    
    # 计算路径长度
    path = planner.extract_path(start, goal)
    if path:
        path_length = 0
        for i in range(1, len(path)):
            dx = path[i][0] - path[i-1][0]
            dy = path[i][1] - path[i-1][1]
            path_length += np.sqrt(dx**2 + dy**2)
        print(f"路径长度: {path_length:.2f}")
        print(f"路径点数: {len(path)}")


if __name__ == "__main__":
    demo_path_planning()