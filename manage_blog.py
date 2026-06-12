#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🌌 Kain's AI Space - 本地寫作與部落格管理 CLI 助手
-------------------------------------------------------------
功能：
1. 一鍵創建新文章 (自動註冊 posts.json 並生成 Markdown 模板)
2. 管理現有文章分類與標籤 (防 JSON 毀損)
3. 下架封存文章 (同步從網頁註銷，並安全封存 Markdown 至備份區)
4. 一鍵專案診斷與測試伺服器啟動
-------------------------------------------------------------
"""

import os
import json
import datetime
import re
import sys
import subprocess

# 初始化 Windows 終端機顏色支援
if sys.platform == "win32":
    os.system("")

# 終端機 ANSI 著色 Token
C_GREEN = "\033[92m"
C_BLUE = "\033[94m"
C_CYAN = "\033[96m"
C_PURPLE = "\033[95m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_RESET = "\033[0m"
C_BOLD = "\033[1m"

POSTS_JSON_PATH = "posts.json"
POSTS_DIR = "posts"

def print_header(title):
    print(f"\n{C_PURPLE}{'=' * 60}{C_RESET}")
    print(f" {C_BOLD}{C_CYAN}{title}{C_RESET}")
    print(f"{C_PURPLE}{'=' * 60}{C_RESET}")

def load_posts():
    """載入 posts.json，若不存在則初始化空陣列"""
    if not os.path.exists(POSTS_JSON_PATH):
        return []
    try:
        with open(POSTS_JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"{C_RED}❌ 載入 posts.json 時發生錯誤: {e}{C_RESET}")
        print(f"{C_YELLOW}⚠️  請確認 json 語法是否正確，或備份該檔案。{C_RESET}")
        return None

def save_posts(posts):
    """安全保存 posts.json，並按日期降序排列（最新文章在最前方）"""
    try:
        # 按發布日期排序 (最新文章日期在最前)
        posts.sort(key=lambda x: x.get("date", "2000-01-01"), reverse=True)
        with open(POSTS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(posts, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"{C_RED}❌ 保存 posts.json 失敗: {e}{C_RESET}")
        return False

def get_existing_categories_and_tags(posts):
    """分析現有文章中已存在的所有大分類與輔助標籤"""
    categories = set()
    tags = set()
    for post in posts:
        post_tags = post.get("tags", [])
        if len(post_tags) > 0:
            categories.add(post_tags[0])  # 第一個 tag 為核心大分類
            for t in post_tags[1:]:       # 其餘為細粒度標籤
                tags.add(t)
    return list(categories), list(tags)

def create_new_post():
    print_header("✍️  創建新文章 (自動註冊與生成 MD)")
    posts = load_posts()
    if posts is None:
        return

    # 1. 輸入文章 ID（檔名）並校驗格式
    while True:
        post_id = input(f"👉 請輸入文章 ID (僅限英數字與短橫線，如 `ai-notes-02`): ").strip().lower()
        if not post_id:
            print(f"{C_RED}❌ 文章 ID 不能為空！{C_RESET}")
            continue
        if not re.match(r"^[a-z0-9\-]+$", post_id):
            print(f"{C_RED}❌ 格式錯誤！ID 只能包含小寫英文字母、數字與短橫線 `-`。{C_RESET}")
            continue
        
        # 檢查是否已存在
        dup = [p for p in posts if p["id"] == post_id]
        if dup:
            print(f"{C_YELLOW}⚠️  此文章 ID 已存在！({dup[0]['title']}){C_RESET}")
            choice = input("是否覆蓋該文章的 metadata 並重新生成 MD 範本？(y/N): ").strip().lower()
            if choice != 'y':
                return
            # 移除舊註冊，稍後覆寫
            posts = [p for p in posts if p["id"] != post_id]
        break

    # 2. 輸入標題
    while True:
        title = input("👉 請輸入文章標題: ").strip()
        if title:
            break
        print(f"{C_RED}❌ 標題不能為空！{C_RESET}")

    # 3. 獲取並顯示目前已有的分類，讓用戶輸入分類
    existing_cats, existing_tags = get_existing_categories_and_tags(posts)
    print(f"\n📌 {C_YELLOW}目前已有的分類：{C_RESET} {', '.join(existing_cats) if existing_cats else '無'}")
    
    while True:
        category = input("👉 請輸入這篇文章的主要分類 (如：AI 評測、AI 學習): ").strip()
        if category:
            break
        print(f"{C_RED}❌ 主要分類不能為空！{C_RESET}")

    # 4. 獲取並顯示目前已有的標籤，讓用戶輸入輔助標籤
    print(f"\n📌 {C_YELLOW}目前已有的輔助標籤：{C_RESET} {', '.join(existing_tags) if existing_tags else '無'}")
    tags_input = input("👉 請輸入這篇文章的輔助標籤 (多個標籤請用英文逗號 `,` 分隔，可不輸入): ").strip()
    
    tags = [category]  # 智慧算法：第一個標籤為核心分類
    if tags_input:
        sub_tags = [t.strip() for t in tags_input.split(",") if t.strip()]
        tags.extend(sub_tags)

    # 5. 輸入摘要
    summary = input("👉 請輸入這篇文章的簡短摘要: ").strip()
    if not summary:
        summary = f"這是關於 {title} 的技術筆記與分享。"

    # 6. 自動填入今天日期
    today = datetime.date.today().strftime("%Y-%m-%d")

    # 7. 新增註冊資料並保存 JSON
    new_post_meta = {
        "id": post_id,
        "title": title,
        "date": today,
        "tags": tags,
        "summary": summary
    }
    
    posts.append(new_post_meta)
    if not save_posts(posts):
        return

    # 8. 自動在 posts/ 目錄下建立 Markdown 檔案模板
    os.makedirs(POSTS_DIR, exist_ok=True)
    md_filepath = os.path.join(POSTS_DIR, f"{post_id}.md")
    
    md_template = f"""# {title}

這是您的新文章範本。✍️

在這一篇文章中，我將分享關於 **{title}** 的核心內容與 AI 學習筆記。

---

## ── 主題探索 ──

在此處開始編輯您的文章內容。您可以使用常規的 Markdown 語法來編寫標題、清單、引用等。

### 1. 核心觀點
*   觀點一：簡潔至上（KISS）。
*   觀點二：透過第一原理思考來分析問題。

### 2. 技術範例
以下是一個程式碼區塊範例：

```python
# 這是您的程式碼高亮區塊
def greet_ai_world():
    print("Welcome to Kain's AI Space!")

greet_ai_world()
```

---

## ── 圖片插入範例 ──

如果您在 `assets/images/` 目錄放置了名為 `example.png` 的圖片，可以在此處以下列方式引用：
![圖片描述](assets/images/example.png)

---

*文章發布日期：{today}*
"""
    
    try:
        with open(md_filepath, "w", encoding="utf-8") as f:
            f.write(md_template.lstrip())
        print(f"\n{C_GREEN}🎉 恭喜！文章建立與註冊成功！{C_RESET}")
        print(f"  📂 JSON 註冊成功 ── {C_BLUE}posts.json{C_RESET}")
        print(f"  📂 MD 檔案已生成 ── {C_BLUE}{md_filepath}{C_RESET}")
        print(f"💡 {C_YELLOW}提示：現在您可以打開該 Markdown 檔案，開始寫入您珍貴的 AI 學習筆記了！{C_RESET}")
    except Exception as e:
        print(f"{C_RED}❌ 生成 MD 檔案失敗: {e}{C_RESET}")

def manage_categories_and_tags():
    print_header("📂 管理現有文章分類與標籤")
    posts = load_posts()
    if not posts:
        print(f"{C_YELLOW}目前沒有任何已註冊的文章！{C_RESET}")
        return

    # 1. 列表顯示所有文章
    print(f"\n📋 {C_BOLD}目前的文章列表：{C_RESET}")
    for idx, post in enumerate(posts):
        post_tags = post.get("tags", [])
        category = post_tags[0] if len(post_tags) > 0 else "無分類"
        sub_tags = post_tags[1:] if len(post_tags) > 1 else []
        print(f"  [{C_GREEN}{idx + 1}{C_RESET}] {C_BOLD}{post['title']}{C_RESET}")
        print(f"      ID: {post['id']} | 發布日期: {post['date']}")
        print(f"      主要分類: {C_BLUE}{category}{C_RESET} | 標籤: {C_YELLOW}{', '.join(sub_tags) if sub_tags else '無'}{C_RESET}\n")

    # 2. 讓用戶選擇要管理的文章
    while True:
        try:
            choice_input = input(f"👉 請輸入要修改的文章編號 (輸入 0 返回選單): ").strip()
            if choice_input == '0':
                return
            idx = int(choice_input) - 1
            if 0 <= idx < len(posts):
                selected_post = posts[idx]
                break
            print(f"{C_RED}❌ 編號超出範圍，請重新輸入！{C_RESET}")
        except ValueError:
            print(f"{C_RED}❌ 輸入格式錯誤，請輸入整數編號！{C_RESET}")

    # 3. 提供修改選項
    print(f"\n{C_CYAN}您選取了文章：{C_RESET} {C_BOLD}{selected_post['title']}{C_RESET}")
    print(f"  [1] 修改主要分類 (目前: {selected_post['tags'][0] if selected_post['tags'] else '無'})")
    print(f"  [2] 修改輔助標籤 (目前: {', '.join(selected_post['tags'][1:]) if len(selected_post['tags']) > 1 else '無'})")
    print(f"  [3] 修改文章標題與摘要")
    print(f"  [4] 返回主選單")
    
    opt = input("👉 請選擇操作 (1-4): ").strip()
    
    if opt == '1':
        existing_cats, _ = get_existing_categories_and_tags(posts)
        print(f"\n📌 {C_YELLOW}目前已有的分類：{C_RESET} {', '.join(existing_cats)}")
        new_cat = input("👉 請輸入新的主要分類名稱: ").strip()
        if new_cat:
            # 修改第一個標籤
            if not selected_post['tags']:
                selected_post['tags'] = [new_cat]
            else:
                selected_post['tags'][0] = new_cat
            if save_posts(posts):
                print(f"{C_GREEN}🎉 分類修改成功！posts.json 已安全更新。{C_RESET}")
    
    elif opt == '2':
        _, existing_tags = get_existing_categories_and_tags(posts)
        print(f"\n📌 {C_YELLOW}目前已有的輔助標籤：{C_RESET} {', '.join(existing_tags)}")
        new_tags_input = input("👉 請輸入新的輔助標籤 (多個標籤請以英文逗號 `,` 分隔): ").strip()
        
        primary_cat = selected_post['tags'][0] if selected_post['tags'] else "未分類"
        new_tags = [primary_cat]
        if new_tags_input:
            new_sub_tags = [t.strip() for t in new_tags_input.split(",") if t.strip()]
            new_tags.extend(new_sub_tags)
        
        selected_post['tags'] = new_tags
        if save_posts(posts):
            print(f"{C_GREEN}🎉 輔助標籤修改成功！posts.json 已安全更新。{C_RESET}")

    elif opt == '3':
        new_title = input(f"👉 請輸入新標題 (按 Enter 保持原樣: {selected_post['title']}): ").strip()
        new_summary = input(f"👉 請輸入新摘要 (按 Enter 保持原樣: {selected_post['summary']}): ").strip()
        
        if new_title:
            selected_post['title'] = new_title
        if new_summary:
            selected_post['summary'] = new_summary
            
        if (new_title or new_summary) and save_posts(posts):
            print(f"{C_GREEN}🎉 文章標題與摘要修改成功！posts.json 已安全更新。{C_RESET}")
            
    else:
        print("已取消修改。")

def delete_post():
    print_header("🗑️  註銷並備份封存文章")
    posts = load_posts()
    if not posts:
        print(f"{C_YELLOW}目前沒有任何已註冊的文章！{C_RESET}")
        return

    # 1. 列表顯示所有文章
    print(f"\n📋 {C_BOLD}目前的文章列表：{C_RESET}")
    for idx, post in enumerate(posts):
        print(f"  [{C_GREEN}{idx + 1}{C_RESET}] {C_BOLD}{post['title']}{C_RESET} (ID: {post['id']})")

    # 2. 讓用戶選擇要下架封存的文章
    while True:
        try:
            choice_input = input(f"\n👉 請輸入要註銷封存的文章編號 (輸入 0 返回選單): ").strip()
            if choice_input == '0':
                return
            idx = int(choice_input) - 1
            if 0 <= idx < len(posts):
                selected_post = posts[idx]
                break
            print(f"{C_RED}❌ 編號超出範圍，請重新輸入！{C_RESET}")
        except ValueError:
            print(f"{C_RED}❌ 輸入格式錯誤，請輸入整數編號！{C_RESET}")

    # 3. 雙重確認
    print(f"\n{C_YELLOW}⚠️  提示：您即將從網頁上註銷並封存文章 {C_BOLD}「{selected_post['title']}」{C_RESET}！")
    print(f"    這將會：")
    print(f"    1. 從 {C_BLUE}posts.json{C_RESET} 移除該文章註冊 (該文將立刻在網頁上隱藏)。")
    print(f"    2. 將實體 Markdown 檔案移動到備份封存區 {C_BLUE}posts_archive/{C_RESET} 中，{C_GREEN}實體檔案安全保留不丟失{C_RESET}。")
    
    confirm = input(f"\n🔥 請輸入 '{C_YELLOW}yes{C_RESET}' 確認下架封存 (輸入其他任何字元取消): ").strip().lower()
    
    if confirm == 'yes':
        # 從 JSON 中刪除註冊
        posts = [p for p in posts if p["id"] != selected_post["id"]]
        if save_posts(posts):
            # 移動實體 Markdown 檔案到備份區
            import shutil
            POSTS_ARCHIVE_DIR = "posts_archive"
            md_filepath = os.path.join(POSTS_DIR, f"{selected_post['id']}.md")
            
            if os.path.exists(md_filepath):
                try:
                    os.makedirs(POSTS_ARCHIVE_DIR, exist_ok=True)
                    archive_filename = f"{selected_post['id']}.md"
                    archive_filepath = os.path.join(POSTS_ARCHIVE_DIR, archive_filename)
                    
                    # 防衝突：如果備份區已經有同名檔案，則加上時間戳記
                    if os.path.exists(archive_filepath):
                        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                        archive_filename = f"{selected_post['id']}_{timestamp}.md"
                        archive_filepath = os.path.join(POSTS_ARCHIVE_DIR, archive_filename)
                        
                    shutil.move(md_filepath, archive_filepath)
                    print(f"{C_GREEN}📦 實體檔案已安全移至備份封存區 ── {C_BLUE}{archive_filepath}{C_RESET}")
                except Exception as e:
                    print(f"{C_RED}❌ 移動實體檔案至備份區失敗: {e}{C_RESET}")
            else:
                print(f"{C_YELLOW}📌 MD 檔案已被手動清除或原先即不存在。{C_RESET}")
            
            print(f"{C_GREEN}🎉 文章已在本地部落格網頁中成功下架註銷，並安全存檔！{C_RESET}")
    else:
        print("註銷封存操作已取消。")

def run_test_server():
    print_header("🧪 一鍵本地測試與診斷")
    test_script = "test_blog_server.py"
    
    if not os.path.exists(test_script):
        print(f"{C_RED}❌ 找不到本地測試腳本 {test_script}！{C_RESET}")
        return
        
    print(f"{C_YELLOW}🚀 正在調用 test_blog_server.py 啟動本地測試環境...{C_RESET}")
    print(f"📌 {C_CYAN}提示：您可以直接在隨後開啟的終端會話中進行瀏覽與交互測試。{C_RESET}")
    print(f"    測試完成後，直接在終端機按下 [Ctrl + C] 即可退回本管理助手菜單。")
    print(f"{C_BLUE}{'=' * 60}{C_RESET}\n")
    
    try:
        # 直接在此處調用 python 腳本
        subprocess.run([sys.executable, test_script], check=True)
    except KeyboardInterrupt:
        print(f"\n{C_GREEN}👋 本地伺服器已成功關閉。{C_RESET}")
    except Exception as e:
        print(f"{C_RED}❌ 執行測試腳本時發生錯誤: {e}{C_RESET}")

def check_git_installed():
    """檢查系統是否安裝了 git"""
    try:
        subprocess.run(["git", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return True
    except Exception:
        return False

def is_git_repository():
    """檢查當前目錄是否為 Git 倉庫"""
    return os.path.exists(".git")

def has_git_remote():
    """檢查是否已經綁定了 remote origin"""
    try:
        res = subprocess.run(["git", "remote"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return "origin" in res.stdout
    except Exception:
        return False

def get_current_branch():
    """獲取當前 Git 分支名稱"""
    try:
        res = subprocess.run(["git", "branch", "--show-current"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        branch = res.stdout.strip()
        return branch if branch else "main"
    except Exception:
        return "main"

def git_status():
    print_header("🔍 查看當前 Git 狀態 (Git Status)")
    if not is_git_repository():
        print(f"{C_YELLOW}⚠️  當前目錄尚未初始化為 Git 倉庫！{C_RESET}")
        return
    try:
        res = subprocess.run(["git", "status", "-s"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        out = res.stdout.strip()
        if not out:
            print(f"{C_GREEN}✨ 工作區非常乾淨，沒有任何未備份變更！{C_RESET}")
        else:
            print(f"{C_BOLD}📂 檢測到以下變更檔案：{C_RESET}")
            for line in out.split("\n"):
                if line.startswith("??"):
                    print(f"  {C_RED}[未追蹤]{C_RESET} {line[3:]}")
                elif line.startswith(" M") or line.startswith("M "):
                    print(f"  {C_YELLOW}[已修改]{C_RESET} {line[3:]}")
                elif line.startswith(" A") or line.startswith("A "):
                    print(f"  {C_GREEN}[已新增]{C_RESET} {line[3:]}")
                elif line.startswith(" D") or line.startswith("D "):
                    print(f"  {C_PURPLE}[已刪除]{C_RESET} {line[3:]}")
                else:
                    print(f"  {C_CYAN}[已變更]{C_RESET} {line}")
    except Exception as e:
        print(f"{C_RED}❌ 執行 git status 失敗: {e}{C_RESET}")

def git_commit():
    print_header("📦 本地一鍵 Commit 備份")
    if not is_git_repository():
        print(f"{C_YELLOW}⚠️  本地尚未初始化 Git 倉庫。{C_RESET}")
        choice = input("是否立即一鍵初始化 Git 倉庫？(y/N): ").strip().lower()
        if choice == 'y':
            try:
                subprocess.run(["git", "init"], check=True)
                if not os.path.exists(".gitignore"):
                    with open(".gitignore", "w", encoding="utf-8") as f:
                        f.write("__pycache__/\n*.pyc\n.DS_Store\n")
                print(f"{C_GREEN}🎉 Git 倉庫已成功初始化，並自動為您配置 .gitignore！{C_RESET}")
            except Exception as e:
                print(f"{C_RED}❌ 初始化 Git 倉庫失敗: {e}{C_RESET}")
                return
        else:
            return

    try:
        subprocess.run(["git", "add", "."], check=True)
        print(f"{C_GREEN}已成功將變更加入暫存區 (git add .)。{C_RESET}")
    except Exception as e:
        print(f"{C_RED}❌ 執行 git add 失敗: {e}{C_RESET}")
        return

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    default_msg = f"Blog update: {now} [auto-commit]"
    
    print(f"\n💡 默認備份訊息：{C_CYAN}{default_msg}{C_RESET}")
    custom_msg = input("👉 請輸入自訂備份訊息 (按 Enter 直接使用默認訊息): ").strip()
    commit_msg = custom_msg if custom_msg else default_msg

    try:
        res = subprocess.run(["git", "commit", "-m", commit_msg], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        print(f"\n{C_GREEN}🎉 本地 Commit 備份成功！{C_RESET}")
        print(f"{C_BLUE}{res.stdout.strip()}{C_RESET}")
    except subprocess.CalledProcessError as e:
        if "nothing to commit" in e.stdout or "nothing to commit" in e.stderr:
            print(f"{C_YELLOW}⚠️  沒有檢測到任何需要 Commit 的變更！{C_RESET}")
        else:
            print(f"{C_RED}❌ Commit 失敗: {e.stderr.strip()}{C_RESET}")
    except Exception as e:
        print(f"{C_RED}❌ 備份發生異常錯誤: {e}{C_RESET}")

def git_push():
    print_header("☁️  一鍵同步至 GitHub (自動部署)")
    if not is_git_repository():
        print(f"{C_RED}❌ 本地尚未初始化 Git 倉庫，請先執行本地 Commit 備份！{C_RESET}")
        return

    if not has_git_remote():
        print(f"{C_YELLOW}⚠️  尚未綁定 GitHub 遠端倉庫。{C_RESET}")
        remote_url = input("👉 請輸入您的 GitHub 倉庫 HTTPS URL (例如 https://github.com/username/repo.git): ").strip()
        if not remote_url:
            print(f"{C_RED}已取消遠端綁定。{C_RESET}")
            return
        try:
            subprocess.run(["git", "remote", "add", "origin", remote_url], check=True)
            print(f"{C_GREEN}🎉 遠端倉庫 origin 綁定成功！{C_RESET}")
        except Exception as e:
            print(f"{C_RED}❌ 遠端綁定失敗: {e}{C_RESET}")
            return

    branch = get_current_branch()
    print(f"\n🚀 正在同步當前分支 {C_CYAN}{branch}{C_RESET} 至遠端 GitHub 倉庫...")
    print(f"{C_YELLOW}提示：若您是首次推送或 GitHub 需要身分驗證，可能會跳出認證視窗，請配合完成授權。{C_RESET}")
    print(f"{C_BLUE}{'=' * 60}{C_RESET}\n")

    try:
        subprocess.run(["git", "push", "-u", "origin", branch], check=True)
        print(f"\n{C_GREEN}🎉 一鍵 GitHub 雲端備份成功！{C_RESET}")
        print(f"📢 {C_CYAN}Netlify 部署流水線已在背景自動觸發！約數十秒後，您的在線部落格將自動更新完成！🚀{C_RESET}")
    except Exception as e:
        print(f"\n{C_RED}❌ 推送至 GitHub 失敗！{C_RESET}")
        print(f"💡 {C_YELLOW}請確認您是否已在 GitHub 創建該倉庫、網路是否暢通，以及本地分支與遠端是否無衝突。{C_RESET}")
        print(f"錯誤詳情: {e}")

def git_tools_menu():
    if not check_git_installed():
        print_header("🚀 版本管理與部署工具")
        print(f"{C_RED}❌ 系統中找不到 Git 工具，請先安裝 Git！{C_RESET}")
        print(f"💡 Windows 用戶下載路徑：https://git-scm.com/download/win")
        return

    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        branch = get_current_branch() if is_git_repository() else "尚未初始化"
        
        print(f"\n{C_PURPLE}┌{'─' * 58}┐{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET} {C_BOLD}{C_CYAN}🚀 Git 版本控制與 GitHub 雲端部署 (分支: {branch}){C_RESET}   {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}├{'─' * 58}┤{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_GREEN}1{C_RESET}] 🔍 查看當前 Git 狀態 (Git Status)                      {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_GREEN}2{C_RESET}] 📦 一鍵本地 Commit 備份 (Git Commit)                   {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_GREEN}3{C_RESET}] ☁️  一鍵同步至 GitHub (自動觸發 Netlify 部署)           {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_RED}4{C_RESET}] ↩️  返回主選單                                           {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}└{'─' * 58}┘{C_RESET}")
        
        choice = input(f"👉 {C_BOLD}請選擇 Git 操作項目 (1-4): {C_RESET}").strip()
        
        if choice == '1':
            git_status()
            input(f"\n按 {C_YELLOW}[Enter]{C_RESET} 鍵返回選單...")
        elif choice == '2':
            git_commit()
            input(f"\n按 {C_YELLOW}[Enter]{C_RESET} 鍵返回選單...")
        elif choice == '3':
            git_push()
            input(f"\n按 {C_YELLOW}[Enter]{C_RESET} 鍵返回選單...")
        elif choice == '4':
            break
        else:
            print(f"{C_RED}❌ 輸入無效，請輸入 1 至 4 的編號！{C_RESET}")
            input(f"\n按 {C_YELLOW}[Enter]{C_RESET} 鍵返回選單...")

def main():
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print(f"\n{C_PURPLE}┌{'─' * 58}┐{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET} {C_BOLD}{C_CYAN}🌌 Kain's AI Space - 本地寫作與部落格管理 CLI 助手{C_RESET}      {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}├{'─' * 58}┤{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_GREEN}1{C_RESET}] ✍️  創建新文章 (自動生成範本與 100% 安全 JSON 註冊)    {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_GREEN}2{C_RESET}] 📂 管理與修改現有文章之分類與標籤 (防語法毀損)        {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_GREEN}3{C_RESET}] 🗑️  下架封存文章 (網頁註銷，實體移至 posts_archive)  {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_GREEN}4{C_RESET}] 🧪 一鍵本地測試與完整性診斷 (自動啟動 8000 伺服器)     {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_GREEN}5{C_RESET}] 🚀 版本控制與 GitHub 雲端部署 (Git Commit & Push)      {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}│{C_RESET}  [{C_RED}6{C_RESET}] 🚪 退出助手                                           {C_PURPLE}│{C_RESET}")
        print(f"{C_PURPLE}└{'─' * 58}┘{C_RESET}")
        
        choice = input(f"👉 {C_BOLD}請輸入操作項目 (1-6): {C_RESET}").strip()
        
        if choice == '1':
            create_new_post()
            input(f"\n按 {C_YELLOW}[Enter]{C_RESET} 鍵返回主選單...")
        elif choice == '2':
            manage_categories_and_tags()
            input(f"\n按 {C_YELLOW}[Enter]{C_RESET} 鍵返回主選單...")
        elif choice == '3':
            delete_post()
            input(f"\n按 {C_YELLOW}[Enter]{C_RESET} 鍵返回主選單...")
        elif choice == '4':
            run_test_server()
            input(f"\n按 {C_YELLOW}[Enter]{C_RESET} 鍵返回主選單...")
        elif choice == '5':
            git_tools_menu()
        elif choice == '6':
            print(f"\n{C_CYAN}👋 感謝您使用 Kain's AI Space 管理助手。祝您寫作愉快！{C_RESET}\n")
            break
        else:
            print(f"{C_RED}❌ 輸入無效，請輸入 1 至 6 的項目編號！{C_RESET}")
            input(f"\n按 {C_YELLOW}[Enter]{C_RESET} 鍵返回主選單...")

if __name__ == "__main__":
    # 確保以腳本所在目錄作為執行根目錄
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir:
        os.chdir(script_dir)
    main()
