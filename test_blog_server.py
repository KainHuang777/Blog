import os
import http.server
import socketserver
import sys

# 1. 定義需要檢查的關鍵檔案清單
REQUIRED_FILES = [
    "index.html",
    "post.html",
    "posts.json",
    "netlify.toml",
    "Update.txt",
    "assets/css/style.css",
    "assets/js/app.js",
    "posts/hello-world.md"
]

PORT = 8000

def check_project_integrity():
    print("=" * 60)
    print(" 🛠️  Kain's AI Space - 專案結構完整性檢查 🛠️")
    print("=" * 60)
    
    missing_files = []
    for filepath in REQUIRED_FILES:
        # 轉換為當前作業系統路徑
        normalized_path = os.path.normpath(filepath)
        if os.path.exists(normalized_path):
            print(f"  [ OK ]  {filepath} 已建立")
        else:
            print(f"  [FAIL]  {filepath} 遺失！")
            missing_files.append(filepath)
            
    print("=" * 60)
    if missing_files:
        print(f"❌ 診斷結果：專案不完整，缺少 {len(missing_files)} 個關鍵檔案！")
        return False
    else:
        print("🎉 診斷結果：專案檔案結構 100% 完整！KISS 純靜態環境已準備就緒。")
        return True

def run_server():
    # 確保以腳本所在目錄作為伺服器根目錄
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    # 允許地址重用，避免 Ctrl+C 重啟時顯示 Address already in use
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"\n🚀 本機測試伺服器已成功啟動！")
            print(f"🔗 請在瀏覽器中開啟以下網址進行預覽與測試：")
            print(f"   👉 http://localhost:{PORT}")
            print(f"\n💡 測試提示：")
            print(f"   1. 開啟首頁後，嘗試點選「開啟我的 AI 學習與個人分享空間」文章卡片。")
            print(f"   2. 確認 Markdown 內容是否成功解密渲染，代碼語法高亮是否正常。")
            print(f"   3. 嘗試滾動頁面，體驗頂部的科技進度條。")
            print(f"   4. 嘗試使用首頁頂部的「標籤過濾器」進行動態文章篩選。")
            print(f"\n🛑 欲關閉伺服器時，請直接在此終端機按下：[Ctrl + C]\n")
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 伺服器已安全關閉。祝您寫作愉快！")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 啟動伺服器時發生錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # 首先進行結構完整性檢查
    if check_project_integrity():
        # 若檢查通過，則啟動伺服器
        run_server()
    else:
        print("❌ 由於專案結構不完整，伺服器啟動已終止。請修復檔案後重試。")
        sys.exit(1)
