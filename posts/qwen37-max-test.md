# 實測 Qwen 3.7 MAX ── 速度快、結構完整，但細節仍需 Qwen 3.6 Plus 救場

> **測試時間**：2026 年 6 月 12 日  
> **測試項目**：網頁設計與 CSS 動畫生成能力  
> **測試模型**：Qwen 3.7 MAX / Qwen 3.6 Plus

---

## 前言

最近阿里雲推出了 **Qwen 3.7 MAX** 模型，宣稱在程式碼生成與網頁設計方面有顯著提升。作為一個長期關注 AI 模型發展的開發者，我決定實際測試一下這個新模型在網頁設計方面的表現。

本次測試的目標是：**請 Qwen 3.7 MAX 設計一個沖繩四日遊的互動式網頁**，包含完整的 HTML 結構、精美的 CSS 樣式與 JavaScript 互動功能。

---

## 測試結果總覽

### 令人驚的價格

首先必須提到的是 Qwen 3.7 MAX 的價格策略。從 API 使用成本來看，它的定價確實朝著 Claude 看齊，但相較於同級別模型仍有競爭力。

<img src="assets/images/qwen37-cost.jpg" alt="Qwen 3.7 MAX 使用成本" style="max-width: 75%; height: auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: block; margin: 2rem auto;">

從圖中可以看到，6 月 12 日這一天，Qwen 3.7 MAX 的使用成本為 **$5.82**，相較於 Qwen 3.6 Plus 的 $0.65 高出不少，但考慮到其定位為高端模型，這個價格仍在可接受範圍內。

### 整體表現：速度快、結構完整

Qwen 3.7 MAX 在生成網頁時展現了以下優點：

1. **生成速度快**：相較於其他模型，Qwen 3.7 MAX 的回應速度明顯更快，幾乎是即時生成完整的網頁結構。
2. **結構完整**：生成的 HTML 結構語意化良好，CSS 樣式涵蓋了響應式設計、動畫效果與毛玻璃效果。
3. **視覺美感**：配色方案專業，使用了漸層、陰影與過渡動畫，整體視覺效果出色。

生成的網頁包含以下功能：
- 固定導覽列與滾動高亮
- Hero 區域粒子動畫與波浪效果
- 時間軸式行程卡片展示
- 自由活動日的動態主題切換
- 捲動視差與進場動畫
- 響應式設計（桌機/平板/手機）

### 出毛病的地方

然而，Qwen 3.7 MAX 並非完美無缺。在細節處理上，它出現了以下問題：

<img src="assets/images/qwen37-issues.jpg" alt="Qwen 3.7 MAX 出問題的地方" style="max-width: 75%; height: auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: block; margin: 2rem auto;">

1. **視覺層級錯誤**：原本預期將背景圖片置於卡片內容的**後方**作為裝飾，但 3.7 MAX 似乎搞錯了層級關係，導致圖片被遮擋或位置偏移，最終只露出極小的一部分。這顯示出它在處理視覺相關的細節（如 z-index、層疊關係）時相當容易出錯。
2. **CSS 變數未正確套用**：某些 CSS 變數（如 `--card-bg`）在 JavaScript 中未正確設定，導致背景圖片無法顯示。
3. **細節遺漏**：部分卡片缺少必要的樣式類別，導致視覺效果不一致。

> **💡 業界現況反思**：
> 其實過往經驗顯示，即使是 Claude 或其他頂級模型，也常常在這種視覺佈局上出錯。有時甚至需要反覆修正多次才能達到完美。但對於價格昂貴的頂級模型來說，如果用戶必須花時間反覆修補這些基礎視覺錯誤，這在成本效益上是難以被接受的。

### 修好之後的樣子

經過 **Qwen 3.6 Plus** 的協助修正後，網頁終於呈現出預期的效果：

<img src="assets/images/qwen37-fixed.jpg" alt="修正後的網頁效果" style="max-width: 75%; height: auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: block; margin: 2rem auto;">

Qwen 3.6 Plus 在以下方面展現了優勢：
1. **細節處理更精準**：能夠正確識別並修正 CSS 變數設定問題。
2. **圖片 URL 修正**：將錯誤的圖片連結替換為正確的 Unsplash 圖片 URL。
3. **樣式一致性**：確保所有卡片都套用了正確的樣式類別。

---

## 技術架構分析

### HTML 結構

生成的 HTML 結構語意化良好，使用了 `<nav>`、`<header>`、`<main>`、`<section>`、`<footer>` 等語意化標籤：

```html
<nav class="nav" id="nav">
  <div class="nav-brand">沖繩四日遊</div>
  <ul class="nav-links">
    <li><a href="#day1" data-day="1">Day 1</a></li>
    <!-- ... -->
  </ul>
</nav>

<header class="hero" id="hero">
  <!-- Hero 區域 -->
</header>

<main class="main">
  <section class="day-section" id="day1" data-day="1">
    <!-- Day 1 行程 -->
  </section>
  <!-- ... -->
</main>
```

### CSS 樣式

CSS 樣式涵蓋了以下技術：
- **CSS 變數**：使用 `:root` 定義全域變數，方便主題切換
- **漸層與動畫**：使用 `linear-gradient`、`@keyframes` 實現視覺效果
- **毛玻璃效果**：使用 `backdrop-filter: blur()` 實現現代化 UI
- **響應式設計**：使用 `@media` 查詢適配不同裝置

### JavaScript 互動

JavaScript 實現了以下互動功能：
- **導覽列滾動高亮**：根據滾動位置自動高亮當前行程
- **粒子動畫**：使用 Canvas 實現 Hero 區域的粒子效果
- **主題切換**：Day 3 自由活動日可動態切換不同主題
- **捲動進場動畫**：使用 `IntersectionObserver` 實現元素進場動畫

---

## 結論

Qwen 3.7 MAX 在網頁設計方面展現了強大的能力，**生成速度快、結構完整、視覺效果出色**。然而，在細節處理上仍有改進空間，特別是圖片載入與 CSS 變數設定方面。

**建議使用方式**：
1. 使用 Qwen 3.7 MAX 進行快速原型設計與結構生成
2. 使用 Qwen 3.6 Plus 進行細節修正與最佳化
3. 兩者搭配使用，可大幅提升開發效率

---

## 線上體驗

您可以直接點擊下方連結，在瀏覽器中查看並測試這個由 Qwen 3.7 MAX 生成的互動網頁：

👉 **[🌊 立即體驗：沖繩經典四日遊互動網頁](Travel/)**

*(建議使用 Chrome 或 Edge 瀏覽器以獲得最佳動畫效果)*
