/**
 * Kain's AI Space - 核心 JavaScript 邏輯
 * -------------------------------------------------------------
 * 包含：首頁文章載入、動態標籤篩選、Markdown 解析、代碼高亮與閱讀進度條。
 */

// ==========================================
//           Supabase 計數器配置
// ==========================================
// 請在此處填入您的 Supabase 專案 URL 與公鑰 (Anon Key)
const SUPABASE_URL = 'https://xgmhuuqfwjocdqryfrys.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TkyC-I7OsQqCYqftt5Ykeg_vYIBotV5';

let supabaseClient = null;

function initSupabase() {
  if (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.error('Supabase 初始化失敗:', e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 初始化 Supabase 計數器
  initSupabase();

  // 辨識當前是在首頁還是文章閱讀頁
  const isPostPage = document.body.classList.contains('post-page');

  if (isPostPage) {
    initPostPage();
  } else {
    initHomePage();
  }
});

/** ==========================================
 *              首頁邏輯 (Home Page)
 *  ========================================== */
async function initHomePage() {
  const postsContainer = document.getElementById('posts-list-container');
  const tagFilterBar = document.getElementById('tag-filter-bar');
  const sidebarTagsContainer = document.getElementById('sidebar-tags-container');
  const statPostCount = document.getElementById('stat-post-count');
  const statTotalViews = document.getElementById('stat-total-views');

  if (!postsContainer) return;

  // 初始化 viewsMap 與 總訪問量 預設為空的
  let viewsMap = {};
  let totalViews = '--';

  // 如果 Supabase 初始化成功，獲取統計數據
  if (supabaseClient) {
    try {
      // 1. 累加主頁訪問量 (home)
      const now = Date.now();
      const lastHomeVisit = localStorage.getItem('visit_home');
      const cooldown = 10 * 60 * 1000; // 10 分鐘冷卻
      
      if (!lastHomeVisit || (now - parseInt(lastHomeVisit)) > cooldown) {
        await supabaseClient.rpc('increment_view', { page_id: 'home' });
        localStorage.setItem('visit_home', now.toString());
      }

      // 2. 批量拉取所有統計數據
      const { data: viewsData, error } = await supabaseClient.from('views').select('id, count');
      if (!error && viewsData) {
        viewsData.forEach(item => {
          viewsMap[item.id] = item.count;
        });
        
        // 取得主頁的總訪問量
        if (viewsMap['home']) {
          totalViews = viewsMap['home'];
        }
      }
    } catch (e) {
      console.error('獲取 Supabase 閱讀統計失敗:', e);
    }
  }

  // 更新首頁總訪問量顯示
  if (statTotalViews) {
    statTotalViews.textContent = totalViews;
  }

  // 1. 獲取文章列表 JSON
  fetch('posts.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('無法讀取文章索引資料');
      }
      return response.json();
    })
    .then(posts => {
      // 更新首頁統計文章數量
      if (statPostCount) {
        statPostCount.textContent = posts.length;
      }

      // 清空載入中動畫
      postsContainer.innerHTML = '';

      if (posts.length === 0) {
        postsContainer.innerHTML = '<div class="widget"><p>目前還沒有任何文章，寫作計畫正在籌備中！</p></div>';
        return;
      }

      // 渲染文章列表
      renderPostCards(posts, postsContainer, viewsMap);

      // 動態分析標籤與分類，渲染側邊欄分類小工具、標籤雲與頂部篩選列
      setupCategoriesAndTags(posts, tagFilterBar, sidebarTagsContainer, postsContainer);
    })
    .catch(error => {
      console.error('Error fetching posts:', error);
      postsContainer.innerHTML = `
        <div class="widget" style="text-align: center; padding: 40px 20px;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; color: #ef4444; margin-bottom: 16px;"></i>
          <h3>無法載入文章</h3>
          <p style="color: var(--text-secondary); margin-top: 8px;">載入文章資料時發生錯誤，請稍後再試。</p>
        </div>
      `;
    });
}

// 渲染文章卡片 HTML
function renderPostCards(posts, container, viewsMap = {}) {
  container.innerHTML = '';
  
  posts.forEach(post => {
    const card = document.createElement('article');
    card.className = 'post-item-card';
    card.setAttribute('data-tags', post.tags.join(','));

    // 生成標籤 HTML
    const tagsHtml = post.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('');

    // 獲取閱讀數，如果沒有，預設顯示 '--' 或 '0' (若 Supabase 已載入但無記錄，則顯示 0；若未配置 Supabase 則隱藏)
    const hasSupabase = supabaseClient !== null;
    const viewsCount = viewsMap[post.id] !== undefined ? viewsMap[post.id] : (hasSupabase ? 0 : null);
    
    // 如果 viewsCount 是 null，表示不顯示閱讀量
    const viewsHtml = viewsCount !== null 
      ? `<span class="post-item-views" title="閱讀次數"><i class="fa-solid fa-eye"></i> ${viewsCount} 次閱讀</span>`
      : '';

    card.innerHTML = `
      <div class="post-item-meta">
        <span class="post-item-date"><i class="fa-solid fa-calendar-days"></i> ${post.date}</span>
        ${viewsHtml}
        <div class="post-item-tags">${tagsHtml}</div>
      </div>
      <h3 class="post-item-title">${post.title}</h3>
      <p class="post-item-summary">${post.summary}</p>
      <a href="post.html?post=${post.id}" class="post-readmore">
        閱讀全文 <i class="fa-solid fa-arrow-right-long"></i>
      </a>
    `;

    container.appendChild(card);
  });
}

// 動態建立分類小工具、標籤雲以及頂部篩選列
function setupCategoriesAndTags(posts, filterBar, sidebarContainer, postsContainer) {
  // 1. 提取所有不重複的標籤（用於頂部過濾器）
  const allTags = new Set();
  posts.forEach(post => {
    post.tags.forEach(tag => allTags.add(tag));
  });
  const tagsArray = Array.from(allTags);

  // 2. 統計主要分類（將每篇文章 tags[0] 視為主要分類）
  const categoryCounts = {};
  const secondaryTags = new Set();

  posts.forEach(post => {
    if (post.tags && post.tags.length > 0) {
      const primaryCat = post.tags[0];
      categoryCounts[primaryCat] = (categoryCounts[primaryCat] || 0) + 1;
      
      // 其餘標籤加入標籤雲
      post.tags.slice(1).forEach(tag => secondaryTags.add(tag));
    }
  });

  // 3. 生成首頁頂部 Filter Bar 的過濾按鈕
  if (filterBar) {
    filterBar.innerHTML = '<button class="filter-btn active" data-tag="all">全部</button>';
    
    tagsArray.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.setAttribute('data-tag', tag);
      btn.textContent = tag;
      filterBar.appendChild(btn);
    });

    // 綁定過濾按鈕點擊事件
    const filterButtons = filterBar.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const selectedTag = btn.getAttribute('data-tag');
        filterPostsByTag(selectedTag);

        // 同步側邊欄分類列表的 active 樣式
        updateSidebarCategoryActive(selectedTag);
      });
    });
  }

  // 4. 動態生成側邊欄「筆記分類」小工具
  const sidebarCategoriesContainer = document.getElementById('sidebar-categories-container');
  if (sidebarCategoriesContainer) {
    sidebarCategoriesContainer.innerHTML = '';
    
    Object.keys(categoryCounts).forEach(category => {
      const li = document.createElement('li');
      li.className = 'category-item';
      li.setAttribute('data-category-tag', category);
      
      li.innerHTML = `
        <span class="category-name"><i class="fa-solid fa-chevron-right"></i> ${category}</span>
        <span class="category-count">${categoryCounts[category]}</span>
      `;
      
      // 點擊側邊欄分類項目時，同步觸發頂部篩選按鈕
      li.addEventListener('click', () => {
        if (filterBar) {
          const matchingBtn = filterBar.querySelector(`.filter-btn[data-tag="${category}"]`);
          if (matchingBtn) {
            matchingBtn.click();
            // 平滑滾動到文章列表
            document.querySelector('.posts-section').scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
      
      sidebarCategoriesContainer.appendChild(li);
    });
  }

  // 5. 動態生成側邊欄「學習領域標籤」標籤雲
  if (sidebarContainer) {
    sidebarContainer.innerHTML = '';
    
    // 若沒有細粒度標籤，則把所有標籤作為備份展示
    const tagsToShow = secondaryTags.size > 0 ? Array.from(secondaryTags) : tagsArray;
    
    tagsToShow.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag-badge';
      span.textContent = tag;
      span.addEventListener('click', () => {
        if (filterBar) {
          const matchingBtn = filterBar.querySelector(`.filter-btn[data-tag="${tag}"]`);
          if (matchingBtn) {
            matchingBtn.click();
            document.querySelector('.posts-section').scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
      sidebarContainer.appendChild(span);
    });
  }
}

// 輔助函式：同步更新側邊欄分類項目的高亮狀態
function updateSidebarCategoryActive(activeTag) {
  const categoryItems = document.querySelectorAll('.category-item');
  categoryItems.forEach(item => {
    const catTag = item.getAttribute('data-category-tag');
    if (catTag === activeTag) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// 根據標籤篩選文章卡片
function filterPostsByTag(tag) {
  const cards = document.querySelectorAll('.post-item-card');
  
  cards.forEach(card => {
    if (tag === 'all') {
      card.style.display = 'flex';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    } else {
      const cardTags = card.getAttribute('data-tags').split(',');
      if (cardTags.includes(tag)) {
        card.style.display = 'flex';
        card.style.opacity = '1';
      } else {
        card.style.display = 'none';
        card.style.opacity = '0';
      }
    }
  });
}


/** ==========================================
 *            文章閱讀頁邏輯 (Post Page)
 *  ========================================== */
function initPostPage() {
  const postLoader = document.getElementById('post-loader');
  const postHeaderArea = document.getElementById('post-header-area');
  const postBodyArea = document.getElementById('post-body-area');
  const errorArea = document.getElementById('error-area');
  const progressBar = document.getElementById('progress-bar');

  // 1. 取得文章 ID
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('post');

  if (!postId) {
    showError();
    return;
  }

  // 啟動文章閱讀統計（背景處理，不阻礙文章渲染）
  handlePostViewCount(postId);

  // 2. 獲取文章的 meta 資訊
  let postMeta = null;
  fetch('posts.json')
    .then(res => res.json())
    .then(posts => {
      postMeta = posts.find(p => p.id === postId);
      
      // 3. 根據 format 決定檔案路徑與副檔名
      const isHtml = postMeta && postMeta.format === 'html';
      const fileExt = isHtml ? 'html' : 'md';
      return fetch(`posts/${postId}.${fileExt}`);
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('找不到該文章的檔案');
      }
      return response.text();
    })
    .then(content => {
      if (postLoader) postLoader.style.display = 'none';
      if (errorArea) errorArea.style.display = 'none';

      const isHtml = postMeta && postMeta.format === 'html';

      if (isHtml) {
        // ----------------- HTML 文章渲染模式 -----------------
        if (postMeta) {
          document.title = `${postMeta.title} | Kain's AI Space`;
        }
        
        // 隱藏原生 Markdown 標頭，因為 HTML 自帶了更為精緻華麗的 header
        if (postHeaderArea) postHeaderArea.style.display = 'none';

        // 渲染 iframe
        postBodyArea.innerHTML = `
          <iframe src="posts/${postId}.html" id="html-post-iframe" style="width: 100%; border: none; overflow: hidden; background: transparent; display: block;"></iframe>
        `;
        postBodyArea.style.display = 'block';

        const iframe = document.getElementById('html-post-iframe');
        iframe.addEventListener('load', () => {
          const iframeWindow = iframe.contentWindow;
          const iframeDoc = iframe.contentDocument || iframeWindow.document;

          // 完美融合理念：去背景、去內外距，讓研究報告無縫融入部落格的毛玻璃 card 中
          if (iframeDoc.body) {
            iframeDoc.body.style.background = 'transparent';
            iframeDoc.body.style.padding = '0';
            iframeDoc.body.style.margin = '0';

            const wrap = iframeDoc.querySelector('.wrap');
            if (wrap) {
              wrap.style.maxWidth = '100%';
              wrap.style.padding = '0';
              wrap.style.gap = '1.5rem';
            }
          }

          // 完美自適應高度
          const resizeIframe = () => {
            iframe.style.height = 'auto'; // 重置高度以取得最精確之收縮高度
            iframe.style.height = iframeDoc.documentElement.scrollHeight + 'px';
          };

          // 稍作延遲，防範動態佈局未計算完成
          setTimeout(resizeIframe, 50);

          // 監聽父視窗 Resize
          window.addEventListener('resize', resizeIframe);

          // 監聽內部 DOM 變化，保證動態內容亦能自適應
          if (typeof ResizeObserver !== 'undefined' && iframeDoc.body) {
            const observer = new ResizeObserver(() => {
              resizeIframe();
            });
            observer.observe(iframeDoc.body);
          }
        });

      } else {
        // ----------------- Markdown 文章渲染模式 -----------------
        // 填充 Meta 資訊
        if (postMeta) {
          document.title = `${postMeta.title} | Kain's AI Space`;
          document.getElementById('post-detail-title').textContent = postMeta.title;
          document.getElementById('post-detail-date').innerHTML = `<i class="fa-solid fa-calendar-days"></i> ${postMeta.date}`;
          
          const tagsContainer = document.getElementById('post-detail-tags');
          if (tagsContainer) {
            tagsContainer.innerHTML = postMeta.tags.map(t => `<span class="tag-badge">${t}</span>`).join('');
          }
        } else {
          document.title = `技術筆記 | Kain's AI Space`;
        }

        // 顯示 Header 區域
        if (postHeaderArea) postHeaderArea.style.display = 'block';

        // 使用 marked.js 將 markdown 解析為 HTML
        if (typeof marked !== 'undefined') {
          marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: true
          });
          postBodyArea.innerHTML = marked.parse(content);
        } else {
          postBodyArea.innerHTML = `<pre style="white-space: pre-wrap;">${content}</pre>`;
        }

        // 顯示文章 Body 區域
        if (postBodyArea) postBodyArea.style.display = 'block';

        // 呼叫 Prism.js 代碼語法高亮
        if (typeof Prism !== 'undefined') {
          Prism.highlightAll();
        }
      }

      // 6. 初始化閱讀進度條
      setupReadingProgressBar(progressBar);
    })
    .catch(error => {
      console.error('Error loading post:', error);
      showError();
    });

  // 展示 404 錯誤頁面
  function showError() {
    if (postLoader) postLoader.style.display = 'none';
    if (postHeaderArea) postHeaderArea.style.display = 'none';
    if (postBodyArea) postBodyArea.style.display = 'none';
    if (errorArea) errorArea.style.display = 'block';
    document.title = '文章未找到 | Kain\'s AI Space';
  }
}

// 閱讀進度條邏輯
function setupReadingProgressBar(progressBar) {
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    if (height > 0) {
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    } else {
      progressBar.style.width = '0%';
    }
  });
}

/**
 * 處理文章閱讀次數統計與防刷機制
 */
async function handlePostViewCount(postId) {
  const viewsCountSpan = document.getElementById('post-views-count');
  const postDetailViews = document.getElementById('post-detail-views');

  if (!supabaseClient) {
    if (postDetailViews) postDetailViews.style.display = 'none';
    return;
  }

  try {
    const now = Date.now();
    const lastVisit = localStorage.getItem(`visit_${postId}`);
    const cooldown = 10 * 60 * 1000; // 10 分鐘冷卻
    
    let currentViews = '--';

    if (!lastVisit || (now - parseInt(lastVisit)) > cooldown) {
      // 1. 調用 RPC 進行累加，並回傳累加後的新數值
      const { data, error } = await supabaseClient.rpc('increment_view', { page_id: postId });
      if (!error && data !== undefined) {
        currentViews = data;
        localStorage.setItem(`visit_${postId}`, now.toString());
      } else {
        console.warn('Supabase RPC 累加失敗，嘗試直接讀取數據:', error);
        // Fallback 讀取當前數值
        const { data: readData } = await supabaseClient.from('views').select('count').eq('id', postId).single();
        if (readData) currentViews = readData.count;
      }
    } else {
      // 2. 只讀取當前數值，不進行累加
      const { data, error } = await supabaseClient.from('views').select('count').eq('id', postId).single();
      if (!error && data) {
        currentViews = data.count;
      } else {
        currentViews = 0; // 若無紀錄則預設為 0
      }
    }

    if (viewsCountSpan) {
      viewsCountSpan.textContent = currentViews;
    }
  } catch (e) {
    console.error('處理文章閱讀統計失敗:', e);
    if (viewsCountSpan) viewsCountSpan.textContent = '--';
  }
}
