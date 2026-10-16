// ============================================================
// Kochi.Watch メインスクリプト
// 構成:1.要素の取得 → 2.処理(開く/閉じる) → 3.検索と絞り込み → 4.イベント登録 → 5.初期状態 → 図の描画
// ============================================================

// ---------- 1. 要素の取得 ----------
const menuBtn = document.querySelector('.site-header__menu-btn');              // ハンバーガーボタン
const siteNav = document.querySelector('.site-nav');              // ナビパネル
const overlay = document.querySelector('.site-nav__overlay');           // 暗幕
const navClose = document.querySelector('.site-nav__close');            // 閉じるボタン
const searchInput = document.querySelector('.site-nav__search-input');  // 検索窓
const filterBtns = document.querySelectorAll('.site-nav__filter-btn');  // 県・市・町・村のボタン
const results = document.querySelector('.site-nav__list');           // リスト(ul)
const resultItems = document.querySelectorAll('.site-nav__list li'); // 35件の議会(li)
const statusText = document.querySelector('.site-nav__status');          // 「○件」の表示
const emptyText = document.querySelector('.site-nav__empty');           // 「該当なし」の表示

// 今選ばれている種別('all' / 'pref' / 'city' / 'town' / 'village')
let currentType = 'all';

// メニュー中に操作できなくする要素(ナビ以外のページ部分)
const pageParts = document.querySelectorAll('.site-header, main, .site-footer');

// ---------- 2. 処理 ----------

// ---- 2-1. 開く ----
function openMenu() {
  resetFilter();                                            // 次に開いた時は最初の状態に戻す
  siteNav.removeAttribute('inert');
  pageParts.forEach((el) => el.setAttribute('inert', ''));

  siteNav.classList.add('is-open');
  overlay.classList.add('is-open');
  document.body.classList.add('is-nav-open');
  navClose.focus();            // キーボード利用者をパネル内へ入れる
  menuBtn.setAttribute('aria-expanded', 'true');
}

// ---- 2-2. 閉じる ----
function closeMenu() {
  // 開いていない時は何もしない(2の対策)
  if (!siteNav.classList.contains('is-open')) return;

  siteNav.classList.remove('is-open');
  overlay.classList.remove('is-open');
  document.body.classList.remove('is-nav-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  siteNav.setAttribute('inert', '');
  pageParts.forEach((el) => el.removeAttribute('inert'));   // 先に解除してから
  menuBtn.focus();                                          // 閉じたら必ずハンバーガーへ戻す
}

// ---------- 3. 検索と絞り込み ----------

// ---- 3-1. 文字をそろえる ----
function normalize(text) {
  return text
    .normalize('NFKC')                             // 全角を半角に
    .toLowerCase()                                 // 小文字に
    .replace(/\s+/g, '')                           // 空白を削除
    .replace(/[\u30a1-\u30f6]/g, (ch) =>           // カタカナをひらがなに
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
}

// ---- 3-2. 絞り込みの本体 ----
function applyFilter() {
  const query = normalize(searchInput.value);
  let count = 0;

  resultItems.forEach((li) => {                                                           // forEach((li) => {...})	35個の li を1つずつ取り出して繰り返す
    const typeOk = currentType === 'all' || li.dataset.type === currentType;              // li.dataset.type	HTMLの data-type="city" の値(data- を除いた名前で読む)
    const name = li.querySelector('a').textContent;
    const readings = (li.dataset.reading || '').split(/\s+/).filter(Boolean);
    const candidates = [name, ...readings, ...readings.map((r) => r + 'ぎかい')];
    const textOk = query === '' || candidates.some((c) => normalize(c).includes(query));
    const show = typeOk && textOk;                                                        // || / &&	「または」/「かつ」

    li.hidden = !show;                                                                    // li.hidden = !show	! は逆にする。表示するなら hidden = false
    if (show) count++;                                                                    // count++	count = count + 1 と同じ
  });

  statusText.textContent = resultItems.length + '件中' + count + '件を表示';
  emptyText.hidden = count !== 0;                                                         // emptyText.hidden = count !== 0	0件のときだけ「該当なし」が出る
  results.scrollTop = 0;                                                                  // results.scrollTop = 0	絞り込んだら先頭から見せる
}

// ---- 3-3. ボタンの「選択中」表示 ----
// ボタンの data-type-filter が currentType と同じなら 'true'、違うなら 'false' が入る
// 属性の値は文字でなければならないので String() で変換
// これでCSSの [aria-pressed="true"] が効いて濃くなる
function updateFilterButtons() {
  filterBtns.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.typeFilter === currentType));
  });
}

// ---- 3-4. 最初に戻す ----
function resetFilter() {
  searchInput.value = '';
  currentType = 'all';
  updateFilterButtons();
  applyFilter();
}

// ---- 3-5. パスをそろえる(末尾のスラッシュと index.html の違いを無視) ----
function normalizePath(path) {
  return path
    .replace(/index\.html$/, '')   // /pref/index.html → /pref/
    .replace(/\/?$/, '/');         // /pref → /pref/
}

// ---- 3-6. 今開いているページのリンクに aria-current="page" を付ける ----
function markCurrentPage() {
  const currentPath = normalizePath(location.pathname);

  resultItems.forEach((li) => {
    const link = li.querySelector('a');
    if (normalizePath(link.pathname) === currentPath) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

// ---------- 4. イベント登録 ----------

// ---- 4-1. ハンバーガークリック:開閉を切り替える ----
menuBtn.addEventListener('click', () => {
  if (siteNav.classList.contains('is-open')) {
    closeMenu();
  } else {
    openMenu();
  }
});

// ---- 4-2. 暗幕クリック:閉じる ----
overlay.addEventListener('click', closeMenu);

// ---- 4-3. Escキー:閉じる ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !e.isComposing) {   // 日本語の変換中は無視する
    closeMenu();
  }
});

// ---- 4-4. 閉じるボタン:閉じる ----
navClose.addEventListener('click', closeMenu);

// ---- 4-5. 検索窓:入力するたびに絞り込む ----
searchInput.addEventListener('input', applyFilter);   // 'input' は、入力欄の中身が変わるたびに起きるイベント

// ---- 4-6. 種別ボタン:押した種別に切り替える ----
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentType = btn.dataset.typeFilter;
    updateFilterButtons();
    applyFilter();                                    // applyFilter の後ろに () を付けないのは、「予約」するため
  });
});

// ---------- 5. 初期状態 ----------
resetFilter();
markCurrentPage();

// ---------- 5-b. 曜日を日付から取得 ----------
function formatDate(date) {
  const week = '日月火水木金土'[date.getDay()];
  return (date.getMonth() + 1) + '月' + date.getDate() + '日(' + week + ')';
}

// ============================================================
// 6. 議会構成(HTMLの一覧を読み取り、半円の扇形図を描く)
// ============================================================
// ---- 6-0. 共通:図と一覧を「選択」と「ホバー」で連動させる ----
function linkItems({ root, items, onChange, extraElements = [], onUserSelect }) {
  let selected = new Set();        // 選ばれているidの集まり(個別なら1つ、凡例なら複数)
  // let selectedId = null;           // クリックで選ばれているid
  let hoverId = null;              // 指している(またはフォーカス中の)id
  // let selectedIds = new Set();     // 複数選択(凡例用)。個別選択も1要素のSetで持つ

  function update() {
    root.toggleAttribute('data-has-selection', selected.size > 0);
    items.forEach((item) => {
      const isSelected = selected.has(item.id);
      const hover = item.id === hoverId;
      item.elements.forEach((el) => {
        el.toggleAttribute('data-selected', isSelected);
        el.toggleAttribute('data-hover', hover);
      });
      item.pressables.forEach((el) => el.setAttribute('aria-pressed', String(isSelected)));
    });
    if (onChange) onChange(items.filter((item) => selected.has(item.id)));
  }

  // 外から選択を差し替える(同じ集まりをもう一度渡したら解除)
  function setSelection(ids) {
    const same = ids.length === selected.size && ids.every((id) => selected.has(id));
    selected = same ? new Set() : new Set(ids);
    update();
    return selected.size > 0;   // 選択中かどうかを返す
  }

  items.forEach((item) => {
    const enter = () => { hoverId = item.id; update(); };
    const leave = () => { if (hoverId === item.id) { hoverId = null; update(); } };
    item.elements.forEach((el) => {
      el.addEventListener('pointerenter', enter);
      el.addEventListener('pointerleave', leave);
      el.addEventListener('focusin', enter);
      el.addEventListener('focusout', leave);
      el.addEventListener('click', () => {
        setSelection([item.id]);
        if (onUserSelect) onUserSelect();
      }); 
    });
  });

  // 図・一覧・追加の要素(凡例)以外をクリックしたら解除
  document.addEventListener('click', (e) => {
    const all = items.flatMap((item) => item.elements.concat(extraElements));
    if (!all.some((el) => el.contains(e.target)) && selected.size > 0) {
      selected = new Set();
      update();
      if (onUserSelect) onUserSelect();
    }
  });

  update();
  return { setSelection };
}

// ---- 6-1. 扇形の1片を表すパスを作る ----
function arcPath(cx, cy, outer, inner, a1, a2) {
  const point = (r, a) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const [x1, y1] = point(outer, a1);
  const [x2, y2] = point(outer, a2);
  const [x3, y3] = point(inner, a2);
  const [x4, y4] = point(inner, a1);

  return ' M ' + x1 + ' ' + y1
       + ' A ' + outer + ' ' + outer + ' 0 0 1 ' + x2 + ' ' + y2
       + ' L ' + x3 + ' ' + y3
       + ' A ' + inner + ' ' + inner + ' 0 0 0 ' + x4 + ' ' + y4
       + ' Z ';
}

// ---- 6-2. 一覧(HTML)を読み取って、図を描く ----
function renderParliament() {
  const layout = document.querySelector('.parliament');
  const chart = document.getElementById('js-parliament-svg');
  const lis = [...document.querySelectorAll('#parliament__list li')];
  if (!layout || !chart || lis.length === 0) return;

  // pgroup = parliamentary group(会派)
  const pgroups = lis.map((li) => ({
    li,
    id: li.dataset.pgroup,
    seats: Number(li.querySelector('.parliament__num').textContent),
    name: li.querySelector('.parliament__name').textContent,
  }));
  const total = pgroups.reduce((sum, g) => sum + g.seats, 0);

  const cx = 110, cy = 110, outer = 100, inner = 40;

  let svg = '<svg viewBox="0 0 220 120" role="img" aria-label="議席の半円図">';
  let angle = Math.PI;

  pgroups.forEach((g) => {
    const next = angle - Math.PI * (g.seats / total);
    svg += '<path class="parliament__arc" data-pgroup="' + g.id + '"'
         + ' d="' + arcPath(cx, cy, outer, inner, angle, next) + '"></path>';
    angle = next;
  });

  // 選択中の縁取り専用の線。扇形より後=最前面
  svg += '<path class="parliament__arc-outline" d=""></path>';
  svg += '<text class="parliament__total" x="' + cx + '" y="' + (cy - 8) + '">' + total + '</text>'
       + '<text class="parliament__total-label" x="' + cx + '" y="' + (cy + 6) + '">議席</text>';
  svg += '</svg>';
  chart.innerHTML = svg;

  const selectedLine = chart.querySelector('.parliament__arc-outline');

  linkItems({
    root: layout,
    items: pgroups.map((g) => {
      const arc = chart.querySelector('.parliament__arc[data-pgroup="' + g.id + '"]');
      return {
        id: g.id,
        elements: [arc, g.li],
        pressables: [g.li.querySelector('.parliament__btn')],
        arc,
      };
    }),
    onChange: (selectedItems) => {
      const first = selectedItems[0];
      selectedLine.setAttribute('d', first ? first.arc.getAttribute('d') : '');
      if (first) {
        selectedLine.setAttribute('data-pgroup', first.id);
      } else {
        selectedLine.removeAttribute('data-pgroup');
      }
    },
  });
}

renderParliament();

// ============================================================
// 7. 議会日程(HTMLの一覧を読み取り、1年の帯グラフを描く)
// ============================================================
function renderSchedule() {
  const root = document.getElementById('schedule');
  const chart = document.getElementById('schedule__chart');
  const lis = [...document.querySelectorAll('#schedule__list li')];

  const WEEK = '日月火水木金土';

  // 表示用:年を含めて、本当の日付で曜日を求める
  function parseDate(text) {
    const [y, m, d] = text.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function formatDate(date) {
    return (date.getMonth() + 1) + '月' + date.getDate() + '日(' + WEEK[date.getDay()] + ')';
  }

  // 一覧の日付の文字を、data-start / data-end から作り直す
  lis.forEach((li) => {
    const range = formatDate(parseDate(li.dataset.start))
                + 'から' + formatDate(parseDate(li.dataset.end));
    li.querySelector('.schedule__item-date').textContent =
      li.hasAttribute('data-tentative') ? '未定(昨年は' + range + ')' : range;
  });

  if (!root || !chart || lis.length === 0) return;

  const year = Number(root.dataset.year);
  const yearStart = new Date(year, 0, 1);
  const yearDays = (new Date(year + 1, 0, 1) - yearStart) / 86400000;

  function toDate(text) {
    const [, m, d] = text.split('-').map(Number);
    return new Date(year, m - 1, d);
  }
  function toPercent(date) {
    return ((date - yearStart) / 86400000 / yearDays) * 100;
  }

  // 月の目盛り(1月〜12月)
  let html = '';
  for (let m = 0; m < 12; m++) {
    const start = toPercent(new Date(year, m, 1));
    const end = toPercent(new Date(year, m + 1, 1));
    html += '<span class="schedule__month" aria-hidden="true"'
          + ' style="--start:' + start.toFixed(3) + ';--span:' + (end - start).toFixed(3) + '">'
          + (m + 1) + '月</span>';
  }

  // 一覧から、定例会ごとのデータを読み取る
  const sessions = lis.map((li) => {
    const from = toPercent(toDate(li.dataset.start));
    return {
      li,
      id: li.dataset.id,
      name: li.querySelector('.schedule__item-name').textContent,
      date: li.querySelector('.schedule__item-date').textContent,
      from,
      span: toPercent(toDate(li.dataset.end)) - from + 100 / yearDays,   // 最終日も含める
      tentative: li.hasAttribute('data-tentative'),
      kind: li.dataset.kind || 'regular',
      label: li.dataset.label || '',
    };
  });

  // 定例会の帯(月より後に書く=手前に描かれる)
  sessions.forEach((s) => {
    html += '<button type="button" class="schedule__bar"'
          + ' data-id="' + s.id + '"'
          + ' data-kind="' + s.kind + '"'
          + (s.tentative ? ' data-tentative' : '')
          + ' style="--start:' + s.from.toFixed(3) + ';--span:' + s.span.toFixed(3) + '"'
          + ' aria-pressed="false" aria-label="' + s.name + ' ' + s.date + '">'
          + s.label + '</button>';
  });
    // 今日の線(表示中の年が今年のときだけ)
  const today = new Date();
  if (today.getFullYear() === year) {
    const pos = toPercent(new Date(year, today.getMonth(), today.getDate()));
    html += '<span class="schedule__today" aria-hidden="true"'
          + ' style="--start:' + pos.toFixed(3) + '"><span>今日</span></span>';
  }
  chart.innerHTML = html;

  const legendBtns = [...document.querySelectorAll('.schedule__filter-btn')];
  let activeLegend = null;   // 押されている凡例ボタン

  function syncLegend() {
    legendBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === activeLegend)));
  }

  const link = linkItems({
    root,
    items: sessions.map((s) => {
      const block = chart.querySelector('.schedule__bar[data-id="' + s.id + '"]');
      return {
        id: s.id,
        elements: [block, s.li],
        pressables: [block, s.li.querySelector('.schedule__item-btn')],
      };
    }),
    extraElements: legendBtns,
    onUserSelect: () => { activeLegend = null; syncLegend(); }
  });

  // 凡例:同じ種別のブロックをまとめて選択
  legendBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const ids = sessions
        .filter((s) => {
          if (s.kind !== btn.dataset.kind) return false;
          if (btn.dataset.filter === 'tentative') return s.tentative;
          if (btn.dataset.filter === 'confirmed') return !s.tentative;
          return true;
        })
        .map((s) => s.id);
      const selecting = link.setSelection(ids);
      activeLegend = selecting ? btn : null;
      syncLegend();
    });
  });
}

renderSchedule();
