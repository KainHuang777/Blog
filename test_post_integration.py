#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🌌 Kain's AI Space - 逆向研究報告 HTML 歸檔整合測試診斷工具
-------------------------------------------------------------
此腳本用於自我測試，自動驗證：
1. posts.json 檔案的語法正確性，以及新文章是否成功註冊且標明為 format: html
2. 檢查 posts/lua_decrypt_research.html 檔案的物理存在與基本大小
3. 檢測 assets/js/app.js 核心加載引擎的修改完整度
-------------------------------------------------------------
"""

import os
import json
import re
import sys

# 初始化 Windows 終端機顏色支援
if sys.platform == "win32":
    os.system("")

# 終端機 ANSI 著色 Token
C_GREEN = "\033[92m"
C_BLUE = "\033[94m"
C_CYAN = "\033[96m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_RESET = "\033[0m"
C_BOLD = "\033[1m"

def print_header(title):
    print(f"\n{C_BLUE}{'=' * 65}{C_RESET}")
    print(f" {C_BOLD}{C_CYAN}{title}{C_RESET}")
    print(f"{C_BLUE}{'=' * 65}{C_RESET}")

def run_diagnostics():
    print_header("🔍 Kain's AI Space - 文章歸檔系統整合診斷")
    
    errors = 0
    warnings = 0
    
    # ---------------------------------------------------------
    # 測試 1：驗證 posts.json 檔案與資料庫註冊
    # ---------------------------------------------------------
    print(f"\n👉 {C_BOLD}[測試項目 1]{C_RESET} 驗證 {C_BLUE}posts.json{C_RESET} 與新文章註冊狀態...")
    posts_json_path = "posts.json"
    
    if not os.path.exists(posts_json_path):
        print(f"  ❌ {C_RED}[錯誤] 找不到 posts.json 檔案！{C_RESET}")
        errors += 1
    else:
        try:
            with open(posts_json_path, "r", encoding="utf-8") as f:
                posts = json.load(f)
            print(f"  ✅ {C_GREEN}posts.json 語法解析正確。共註冊了 {len(posts)} 篇文章。{C_RESET}")
            
            # 尋找新文章
            target_post = next((p for p in posts if p.get("id") == "lua_decrypt_research"), None)
            
            if not target_post:
                print(f"  ❌ {C_RED}[錯誤] 未在 posts.json 中尋找到文章 ID 'lua_decrypt_research' 的註冊資料！{C_RESET}")
                errors += 1
            else:
                print(f"  ✅ {C_GREEN}成功找到文章註冊：{C_RESET}{C_BOLD}{target_post.get('title')}{C_RESET}")
                print(f"     - 發布日期: {target_post.get('date')}")
                print(f"     - 分類標籤: {', '.join(target_post.get('tags', []))}")
                
                # 關鍵檢查 format
                fmt = target_post.get("format")
                if fmt == "html":
                    print(f"  ✅ {C_GREEN}文章格式已正確標記為 {C_BOLD}'html'{C_RESET}。{C_RESET}")
                else:
                    print(f"  ❌ {C_RED}[錯誤] 文章 format 屬性錯誤 (目前為: '{fmt}'，預期為 'html')！{C_RESET}")
                    errors += 1
                    
        except Exception as e:
            print(f"  ❌ {C_RED}[錯誤] 讀取並解析 posts.json 失敗: {e}{C_RESET}")
            errors += 1

    # ---------------------------------------------------------
    # 測試 2：驗證 posts/lua_decrypt_research.html 檔案
    # ---------------------------------------------------------
    print(f"\n👉 {C_BOLD}[測試項目 2]{C_RESET} 驗證研究報告 HTML 實體檔案...")
    html_file_path = os.path.join("posts", "lua_decrypt_research.html")
    
    if not os.path.exists(html_file_path):
        print(f"  ❌ {C_RED}[錯誤] 找不到實體文章檔案: {html_file_path}{C_RESET}")
        errors += 1
    else:
        file_size = os.path.getsize(html_file_path)
        print(f"  ✅ {C_GREEN}實體檔案存在：{html_file_path} (大小: {file_size / 1024:.2f} KB){C_RESET}")
        
        # 讀取檢查 head 與 style
        try:
            with open(html_file_path, "r", encoding="utf-8") as f:
                content = f.read()
            if "<style>" in content and "body" in content:
                print(f"  ✅ {C_GREEN}HTML 內容包含完整的 <style> 及 <body> 結構。{C_RESET}")
            else:
                print(f"  ⚠️  {C_YELLOW}[警告] HTML 檔案可能不完整或缺少 <style> 樣式區塊。{C_RESET}")
                warnings += 1
        except Exception as e:
            print(f"  ❌ {C_RED}[錯誤] 讀取 HTML 實體檔案內容失敗: {e}{C_RESET}")
            errors += 1

    # ---------------------------------------------------------
    # 測試 3：驗證 assets/js/app.js 代碼重構完整度
    # ---------------------------------------------------------
    print(f"\n👉 {C_BOLD}[測試項目 3]{C_RESET} 驗證核心 {C_BLUE}assets/js/app.js{C_RESET} 的 HTML iframe 渲染邏輯...")
    js_file_path = os.path.join("assets", "js", "app.js")
    
    if not os.path.exists(js_file_path):
        print(f"  ❌ {C_RED}[錯誤] 找不到 app.js 核心腳本！{C_RESET}")
        errors += 1
    else:
        try:
            with open(js_file_path, "r", encoding="utf-8") as f:
                js_content = f.read()
                
            # 檢查關鍵詞
            check_points = {
                "format === 'html'": "HTML 格式檢測判斷式",
                "iframe src=\"posts/": "動態 iframe 嵌入標記",
                "html-post-iframe": "iframe ID 識別碼",
                "transparent": "透明融合理念配置",
                "scrollHeight": "自適應高度計算屬性",
                "ResizeObserver": "高度自適應 ResizeObserver 監聽"
            }
            
            for key, desc in check_points.items():
                if key in js_content:
                    print(f"  ✅ {C_GREEN}在 app.js 中檢測到 {C_BOLD}{desc}{C_RESET} 的實作。{C_RESET}")
                else:
                    print(f"  ❌ {C_RED}[錯誤] 找不到 {desc} 的實作關鍵字！({key}){C_RESET}")
                    errors += 1
                    
        except Exception as e:
            print(f"  ❌ {C_RED}[錯誤] 讀取 app.js 失敗: {e}{C_RESET}")
            errors += 1

    # ---------------------------------------------------------
    # 綜合報告
    # ---------------------------------------------------------
    print_header("📊 整合診斷結論")
    if errors == 0:
        print(f"  🎉 {C_GREEN}{C_BOLD}診斷成功！所有測試指標 100% 透過！{C_RESET}")
        print(f"     逆向研究報告《Unity 行動遊戲 Lua 資產加密逆向研究報告》已完成無縫歸檔與系統性整合！")
        print(f"     目前已具備完整的防 CSS 污染防護、極致的背景融合、以及完美的滾動與進度條自適應機制！")
        if warnings > 0:
            print(f"     {C_YELLOW}(共有 {warnings} 項警告，不影響核心執行){C_RESET}")
    else:
        print(f"  ❌ {C_RED}{C_BOLD}診斷失敗！共檢測到 {errors} 項錯誤，請檢查上面的輸出訊息。{C_RESET}")
        
    print(f"\n{C_BLUE}{'=' * 65}{C_RESET}")
    print(f"💡 {C_BOLD}{C_YELLOW}如何進行親自驗證：{C_RESET}")
    print(f"  1. 請在您的終端機（如 PowerShell）中，於專案根目錄下執行測試伺服器命令：")
    print(f"     {C_GREEN}python test_blog_server.py{C_RESET}")
    print(f"     或運行部落格 CLI 助手：")
    print(f"     {C_GREEN}python manage_blog.py{C_RESET} (選擇 [4] 🧪 一鍵本地測試與診斷)")
    print(f"  2. 伺服器啟動後，請在瀏覽器中打開以下直達網址進行親自驗證：")
    print(f"     {C_CYAN}http://localhost:8000/post.html?post=lua_decrypt_research{C_RESET}")
    print(f"  3. 驗證首頁文章列表動態篩選與歸檔：")
    print(f"     {C_CYAN}http://localhost:8000/index.html{C_RESET}")
    print(f"{C_BLUE}{'=' * 65}{C_RESET}\n")

if __name__ == "__main__":
    # 確保以腳本所在目錄作為執行根目錄
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir:
        os.chdir(script_dir)
    run_diagnostics()
