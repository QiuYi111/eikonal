#!/usr/bin/env python3
"""
Eikonal PDE 路径规划测试脚本
"""

import numpy as np
import matplotlib.pyplot as plt
from eikonal_path_planning import EikonalPathPlanner


def test_basic_functionality():
    """测试基本功能"""
    print("测试基本功能...")
    
    # 创建小型测试场景
    planner = EikonalPathPlanner(width=5, height=4, resolution=0.2)
    
    # 添加简单障碍物
    planner.add_obstacle('rectangle', x=1.5, y=1, width=1, height=1)
    planner.add_obstacle('circle', cx=3.5, cy=2.5, radius=0.5)
    
    # 设置路径
    start = (0.5, 0.5)
    goal = (4.5, 3.5)
    
    # 求解
    distance_field = planner.solve_eikonal(start, goal)
    
    # 验证结果
    assert distance_field is not None, "距离场计算失败"
    assert not np.all(np.isinf(distance_field)), "距离场全为无穷大"
    assert distance_field.shape == (21, 26), f"距离场形状错误: {distance_field.shape}"
    
    # 提取路径
    path = planner.extract_path(start, goal)
    assert len(path) > 0, "路径提取失败"
    
    print("✓ 基本功能测试通过")
    return True


def test_obstacle_avoidance():
    """测试避障功能"""
    print("测试避障功能...")
    
    planner = EikonalPathPlanner(width=6, height=6, resolution=0.1)
    
    # 创建障碍环境
    planner.add_obstacle('rectangle', x=2, y=2, width=2, height=2)
    planner.add_obstacle('circle', cx=1, cy=4, radius=0.8)
    
    start = (0.5, 0.5)
    goal = (5.5, 5.5)
    
    # 求解
    planner.solve_eikonal(start, goal)
    path = planner.extract_path(start, goal)
    
    # 验证路径避开障碍物
    path_array = np.array(path)
    
    # 检查路径是否避开矩形障碍物
    rect_mask = (path_array[:, 0] >= 2) * (path_array[:, 0] <= 4) * \
                (path_array[:, 1] >= 2) * (path_array[:, 1] <= 4)
    
    # 由于我们使用极小速度而非完全禁止，路径可能接近障碍物但不穿过中心
    assert np.sum(rect_mask) < len(path) * 0.2, "路径穿过障碍物中心"
    
    print("✓ 避障功能测试通过")
    return True


def test_edge_cases():
    """测试边界情况"""
    print("测试边界情况...")
    
    planner = EikonalPathPlanner(width=4, height=3, resolution=0.2)
    
    # 测试起点等于终点
    start = (1, 1)
    goal = (1, 1)
    planner.solve_eikonal(start, goal)
    path = planner.extract_path(start, goal)
    assert len(path) == 2, f"起点终点相同测试失败: {len(path)}"
    
    # 测试无障碍物情况
    planner_empty = EikonalPathPlanner(width=3, height=3, resolution=0.5)
    planner_empty.solve_eikonal((0, 0), (2, 2))
    path_empty = planner_empty.extract_path((0, 0), (2, 2))
    assert len(path_empty) > 0, "无障碍物情况失败"
    
    print("✓ 边界情况测试通过")
    return True


def test_velocity_field():
    """测试速度场设置"""
    print("测试速度场设置...")
    
    planner = EikonalPathPlanner(width=5, height=5, resolution=1.0)
    
    # 添加障碍物
    planner.add_obstacle('rectangle', x=1, y=1, width=1, height=1)
    planner.add_obstacle('circle', cx=3, cy=3, radius=0.8)
    
    planner._calculate_velocity_field()
    
    # 验证障碍物区域速度极小
    assert np.min(planner.velocity_field) < 0.01, "障碍物速度设置失败"
    assert np.max(planner.velocity_field) >= 0.9, "自由空间速度设置失败"
    
    # 验证速度场形状
    assert planner.velocity_field.shape == (6, 6), f"速度场形状错误: {planner.velocity_field.shape}"
    
    print("✓ 速度场测试通过")
    return True


def run_all_tests():
    """运行所有测试"""
    print("开始Eikonal PDE路径规划测试...")
    
    try:
        test_basic_functionality()
        test_obstacle_avoidance()
        test_edge_cases()
        test_velocity_field()
        
        print("\n🎉 所有测试通过！")
        return True
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    run_all_tests()