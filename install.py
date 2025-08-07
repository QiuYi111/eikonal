#!/usr/bin/env python3
"""
安装脚本来设置Eikonal PDE路径规划环境
"""

import subprocess
import sys
import os


def run_command(cmd):
    """运行系统命令"""
    print(f"运行: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"错误: {result.stderr}")
        return False
    print(f"输出: {result.stdout}")
    return True


def install_with_uv():
    """使用uv进行安装"""
    print("使用uv进行安装...")
    
    # 检查uv是否可用
    if not run_command("uv --version"):
        print("uv未安装，尝试使用pip...")
        return install_with_pip()
    
    # 创建虚拟环境
    if not run_command("uv venv"):
        return False
    
    # 安装依赖
    if not run_command("uv pip install -e ."):
        return False
    
    # 运行测试
    if not run_command("uv run python test_eikonal.py"):
        print("测试失败，但安装完成")
    
    return True


def install_with_pip():
    """使用pip进行安装"""
    print("使用pip进行安装...")
    
    # 安装依赖
    if not run_command(f"{sys.executable} -m pip install -e ."):
        return False
    
    # 运行测试
    if not run_command(f"{sys.executable} test_eikonal.py"):
        print("测试失败，但安装完成")
    
    return True


def check_dependencies():
    """检查依赖是否安装成功"""
    try:
        import numpy
        import matplotlib.pyplot as plt
        import scipy
        print("✓ 所有依赖已安装")
        return True
    except ImportError as e:
        print(f"❌ 依赖缺失: {e}")
        return False


def main():
    """主安装函数"""
    print("开始安装Eikonal PDE路径规划环境...")
    
    # 检查Python版本
    if sys.version_info < (3, 8):
        print("❌ 需要Python 3.8或更高版本")
        return False
    
    print(f"Python版本: {sys.version}")
    
    # 尝试使用uv安装
    success = install_with_uv()
    
    if not success:
        print("uv安装失败，尝试pip...")
        success = install_with_pip()
    
    if success:
        print("检查依赖...")
        if check_dependencies():
            print("\n🎉 安装完成！")
            print("运行以下命令开始演示：")
            print("  python eikonal_path_planning.py")
            print("或")
            print("  uv run python eikonal_path_planning.py")
        else:
            print("\n⚠️  安装完成，但依赖检查失败")
    else:
        print("\n❌ 安装失败")
        return False
    
    return True


if __name__ == "__main__":
    main()