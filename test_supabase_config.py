#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase 計數器配置與 API 連線測試探針
-------------------------------------------------------------
此腳本能自動解析 assets/js/app.js 中的 Supabase 配置，
並對您的 Supabase 專案進行連線與 RPC (Stored Procedure) 可用性測試。
"""

import os
import re
import urllib.request
import urllib.error
import json

# 配置路徑
APP_JS_PATH = os.path.join("assets", "js", "app.js")

def print_header(title):
    print("=" * 60)
    print(f" {title} ".center(60, "■"))
    print("=" * 60)

def extract_supabase_config():
    if not os.path.exists(APP_JS_PATH):
        print(f"[❌ 錯誤] 找不到 app.js 檔案，路徑應為: {APP_JS_PATH}")
        return None, None

    url_pattern = re.compile(r"const\s+SUPABASE_URL\s*=\s*['\"]([^'\"]+)['\"]")
    key_pattern = re.compile(r"const\s+SUPABASE_ANON_KEY\s*=\s*['\"]([^'\"]+)['\"]")

    url = None
    key = None

    with open(APP_JS_PATH, "r", encoding="utf-8") as f:
        for line in f:
            url_match = url_pattern.search(line)
            if url_match:
                url = url_match.group(1)
            key_match = key_pattern.search(line)
            if key_match:
                key = key_match.group(1)

    return url, key

def test_connection(url, anon_key):
    print(f"\n📡 正在發起連線測試...")
    print(f"   專案網址 (URL): {url}")
    
    # 1. 測試基礎 API 連接與 Anon Key 效力 (讀取 views 資料表)
    rest_url = f"{url.rstrip('/')}/rest/v1/views?select=count"
    req = urllib.request.Request(rest_url)
    req.add_header("apikey", anon_key)
    req.add_header("Authorization", f"Bearer {anon_key}")
    req.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            status = response.getcode()
            if status in [200, 201]:
                print("   [✅ 成功] Supabase API 基礎連線成功，且 views 資料表可以被公開讀取。")
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8') if e else ""
        print(f"   [❌ 失敗] API 回傳錯誤代碼: {e.code}")
        print(f"   [詳情]: {body}")
        print("   👉 提示: 請確認您是否已在 SQL Editor 執行建表與 RLS 授權 SQL。")
        return False
    except Exception as e:
        print(f"   [❌ 失敗] 無法連線至 Supabase 伺服器: {e}")
        print("   👉 提示: 請檢查您的網路連線或 Supabase 專案 URL 是否輸入正確。")
        return False

    # 2. 測試 RPC increment_view 累加函數
    print(f"\n⚡ 正在測試計數器 RPC 累加函數 (increment_view)...")
    rpc_url = f"{url.rstrip('/')}/rest/v1/rpc/increment_view"
    
    # 使用 test_probe 作為測試用的 page_id
    payload = json.dumps({"page_id": "test_probe"}).encode('utf-8')
    
    req_rpc = urllib.request.Request(rpc_url, data=payload, method="POST")
    req_rpc.add_header("apikey", anon_key)
    req_rpc.add_header("Authorization", f"Bearer {anon_key}")
    req_rpc.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req_rpc, timeout=8) as response:
            status = response.getcode()
            res_body = response.read().decode('utf-8')
            if status in [200, 201]:
                print(f"   [✅ 成功] increment_view RPC 累加成功！")
                print(f"   [結果]: 當前測試頁面 'test_probe' 的累加後閱讀數為: {res_body} 次")
                return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8') if e else ""
        print(f"   [❌ 失敗] RPC 累加錯誤，代碼: {e.code}")
        print(f"   [詳情]: {body}")
        print("   👉 提示: 請確認您已在 Supabase 執行 SQL Editor 內的 'CREATE FUNCTION public.increment_view'。")
        return False
    except Exception as e:
        print(f"   [❌ 失敗] 無法呼叫 RPC 函數: {e}")
        return False

def main():
    print_header("Supabase 連線測試探針")
    
    url, key = extract_supabase_config()
    
    if not url or not key:
        print("[❌ 錯誤] 無法從 app.js 中提取 Supabase 的變數配置。")
        return

    is_placeholder_url = url == "YOUR_SUPABASE_URL"
    is_placeholder_key = key == "YOUR_SUPABASE_ANON_KEY"

    if is_placeholder_url or is_placeholder_key:
        print("[⚠️ 提示] 目前 app.js 中的配置仍為預留的 Placeholder 預設值：")
        print(f"   - SUPABASE_URL: {url}")
        print(f"   - SUPABASE_ANON_KEY: {key}")
        print("\n🛠️  如何配置您的專案：")
        print("   1. 登入 Supabase 控制台 (https://supabase.com)")
        print("   2. 前往 Project Settings -> API 頁面")
        print("   3. 複製 Project URL 與 anon public key")
        print("   4. 填入 assets/js/app.js 頂部的對應常數中")
        print("\n💡 填寫完畢後，請重新運行此測試腳本以進行線上實測。")
        print("=" * 60)
        return

    print("[📊 配置已偵測]")
    print(f"   - URL: {url[:15]}...{url[-5:] if len(url) > 20 else ''}")
    print(f"   - KEY: {key[:15]}...{key[-5:] if len(key) > 20 else ''}")
    
    success = test_connection(url, key)
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 [恭喜] 您的 Supabase 部落格計數器後端配置 100% 成功且運作正常！")
        print("🚀 現在您可以發布部署網頁，開啟瀏覽器即可看到精美的動態計數器。")
    else:
        print("⚠️  組態檢測未通過，請根據上述錯誤提示進行排查修正。")
    print("=" * 60)

if __name__ == "__main__":
    main()
