#!/usr/bin/env python3
"""
Eikonal PDE 路径规划演示脚本
"""

from eikonal_path_planning import EikonalPathPlanner
import matplotlib.pyplot as plt


def demo_simple():
    """简单场景演示"""
    print("=== 简单场景演示 ===")
    planner = EikonalPathPlanner(width=8, height=6, resolution=0.15)
    
    # 添加少量障碍物
    planner.add_obstacle('rectangle', x=2, y=1, width=1.5, height=2)
    planner.add_obstacle('circle', cx=5, cy=4, radius=0.7)
    
    start = (0.5, 0.5)
    goal = (7.5, 5.5)
    
    planner.solve_eikonal(start, goal)
    planner.visualize(start, goal, save_path='demo_simple.png')


def demo_complex():
    """复杂场景演示"""
    print("=== 复杂场景演示 ===")
    planner = EikonalPathPlanner(width=12, height=10, resolution=0.08)
    
    # 添加复杂障碍物环境
    obstacles = [
        {'type': 'rectangle', 'x': 1, 'y': 1, 'width': 2, 'height': 1},
        {'type': 'rectangle', 'x': 4, 'y': 2, 'width': 1, 'height': 3},
        {'type': 'rectangle', 'x': 7, 'y': 1, 'width': 1.5, 'height': 2},
        {'type': 'circle', 'cx': 2.5, 'cy': 7, 'radius': 1.0},
        {'type': 'circle', 'cx': 6, 'cy': 5, 'radius': 0.8},
        {'type': 'circle', 'cx': 9, 'cy': 7, 'radius': 0.6},
        {'type': 'rectangle', 'x': 8, 'y': 4, 'width': 3, 'height': 1},
    ]
    
    for obs in obstacles:
        planner.add_obstacle(**obs)
    
    start = (0.5, 0.5)
    goal = (11.5, 9.5)
    
    planner.solve_eikonal(start, goal)
    planner.visualize(start, goal, save_path='demo_complex.png')


def demo_maze():
    """迷宫场景演示"""
    print("=== 迷宫场景演示 ===")
    planner = EikonalPathPlanner(width=10, height=8, resolution=0.1)
    
    # 创建迷宫式障碍物
    # 水平墙
    for y in [2, 4, 6]:
        planner.add_obstacle('rectangle', x=1, y=y, width=8, height=0.5)
    
    # 垂直墙（带通道）
    planner.add_obstacle('rectangle', x=3, y=0, width=0.5, height=2)
    planner.add_obstacle('rectangle', x=3, y=2.5, width=0.5, height=1.5)
    planner.add_obstacle('rectangle', x=3, y=4.5, width=0.5, height=1.5)
    planner.add_obstacle('rectangle', x=3, y=6.5, width=0.5, height=1.5)
    
    planner.add_obstacle('rectangle', x=6, y=0.5, width=0.5, height=1.5)
    planner.add_obstacle('rectangle', x=6, y=2.5, width=0.5, height=1.5)
    planner.add_obstacle('rectangle', x=6, y=4.5, width=0.5, height=1.5)
    planner.add_obstacle('rectangle', x=6, y=6.5, width=0.5, height=1.5)
    
    # 添加一些圆形障碍物
    planner.add_obstacle('circle', cx=5, cy=1, radius=0.3)
    planner.add_obstacle('circle', cx=5, cy=7, radius=0.3)
    
    start = (0.5, 0.5)
    goal = (9.5, 7.5)
    
    planner.solve_eikonal(start, goal)
    planner.visualize(start, goal, save_path='demo_maze.png')


def main():
    """运行所有演示"""
    print("Eikonal PDE 路径规划演示")
    print("=" * 40)
    
    try:
        demo_simple()
        demo_complex()
        demo_maze()
        
        print("\n🎉 所有演示完成！")
        print("已生成以下图像文件：")
        print("  - demo_simple.png: 简单场景")
        print("  - demo_complex.png: 复杂场景")
        print("  - demo_maze.png: 迷宫场景")
        
    except Exception as e:
        print(f"演示失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()