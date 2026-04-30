(function () {
  "use strict";

  /**
   * 面试卡片配置：统一维护文案与路径，便于后续扩展
   */
  var CARD_TITLE = "面试真题";
  var GUIDE_DIR = "./interview-guide/";
  var MARKED_CDN_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/marked/15.0.12/marked.min.js";
  var markedReadyPromise = null;

  /**
   * 入口函数：当 DOM 可用后初始化组件
   */
  function boot() {
    // 避免重复初始化
    if (document.querySelector(".interview-card")) {
      return;
    }

    var pageName = getCurrentHtmlName();
    if (!pageName) {
      return;
    }

    var markdownUrl = GUIDE_DIR + pageName.replace(/\.html$/i, ".md");
    loadMarkdown(markdownUrl)
      .then(function (markdownText) {
        var qaList = extractQaItems(markdownText);
        // 没有题目就不渲染卡片，避免空壳组件干扰课堂内容
        if (!qaList.length) {
          return;
        }
        return ensureMarkedReady()
          .catch(function () {
            // Markdown 库加载失败时降级，避免组件完全不可用
          })
          .then(function () {
            renderInterviewCard(qaList);
          });
      })
      .catch(function () {
        // 对于不存在的映射文件，静默失败即可
      });
  }

  /**
   * 读取当前页面文件名，例如 4-java-basic.html
   */
  function getCurrentHtmlName() {
    var path = window.location.pathname || "";
    var fileName = path.substring(path.lastIndexOf("/") + 1);
    if (!fileName || !/\.html$/i.test(fileName)) {
      return "";
    }
    return fileName;
  }

  /**
   * 拉取 markdown 文本
   */
  function loadMarkdown(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) {
        throw new Error("load markdown failed");
      }
      return res.text();
    });
  }

  /**
   * 动态加载脚本
   */
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        reject(new Error("load script failed"));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * 确保 marked 可用，仅加载一次
   */
  function ensureMarkedReady() {
    if (window.marked && typeof window.marked.parse === "function") {
      return Promise.resolve();
    }
    if (markedReadyPromise) {
      return markedReadyPromise;
    }
    markedReadyPromise = loadScript(MARKED_CDN_URL).then(function () {
      if (window.marked && typeof window.marked.setOptions === "function") {
        window.marked.setOptions({
          gfm: true,
          breaks: true,
        });
      }
    });
    return markedReadyPromise;
  }

  /**
   * 从 markdown 中提取 “题目 + 解答”
   * 规则：以三级标题（###）作为题目，后续内容作为答案，直到下一个三级标题
   */
  function extractQaItems(markdownText) {
    var lines = String(markdownText || "").split(/\r?\n/);
    var items = [];
    var current = null;

    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      var h3 = line.match(/^###\s+(.+?)\s*$/);

      if (h3) {
        if (current && normalizeText(current.answer).length > 0) {
          items.push(current);
        }
        current = {
          question: h3[1].trim(),
          answer: "",
        };
        continue;
      }

      if (current) {
        current.answer += line + "\n";
      }
    }

    if (current && normalizeText(current.answer).length > 0) {
      items.push(current);
    }

    return items;
  }

  /**
   * 归一化文本，便于判断是否为空
   */
  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  /**
   * 渲染折叠卡片：初始折叠，点击标题展开
   */
  function renderInterviewCard(qaList) {
    var card = document.createElement("aside");
    card.className = "interview-card is-collapsed";
    card.setAttribute("aria-label", CARD_TITLE);

    var toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "interview-card__toggle";
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.innerHTML =
      '<span class="interview-card__badge">高频考点</span>' +
      '<span class="interview-card__title">' +
      CARD_TITLE +
      "</span>" +
      '<span class="interview-card__icon" aria-hidden="true">面</span>';

    var panel = document.createElement("div");
    panel.className = "interview-card__panel";
    panel.hidden = true;

    var list = document.createElement("div");
    list.className = "interview-card__list";

    for (var i = 0; i < qaList.length; i += 1) {
      list.appendChild(buildQaItem(qaList[i], i + 1));
    }

    panel.appendChild(list);
    card.appendChild(toggleButton);
    card.appendChild(panel);
    document.body.appendChild(card);

    toggleButton.addEventListener("click", function () {
      var expanded = toggleButton.getAttribute("aria-expanded") === "true";
      toggleButton.setAttribute("aria-expanded", expanded ? "false" : "true");
      card.classList.toggle("is-collapsed", expanded);
      panel.hidden = expanded;
      // 折叠态显示“面”，展开态显示“收”，语义更明确
      var iconNode = toggleButton.querySelector(".interview-card__icon");
      if (iconNode) {
        iconNode.textContent = expanded ? "面" : "收";
      }
    });
  }

  /**
   * 渲染单条问答
   */
  function buildQaItem(item, index) {
    var block = document.createElement("article");
    block.className = "interview-card__item";

    var title = document.createElement("h4");
    title.className = "interview-card__q";
    title.textContent = index + ". " + item.question;

    var answer = document.createElement("div");
    answer.className = "interview-card__a";
    renderMarkdown(item.answer, answer);

    block.appendChild(title);
    block.appendChild(answer);
    return block;
  }

  /**
   * Markdown 渲染：优先使用 marked，失败时回退到轻量渲染
   */
  function renderMarkdown(markdownText, container) {
    var text = String(markdownText || "");
    if (window.marked && typeof window.marked.parse === "function") {
      try {
        var html = window.marked.parse(text);
        container.innerHTML = sanitizeHtml(html);
        normalizeLinks(container);
        return;
      } catch (e) {
        // 回退到轻量渲染
      }
    }
    renderMarkdownLite(text, container);
  }

  /**
   * 轻量 markdown 回退渲染（兜底）
   */
  function renderMarkdownLite(markdownText, container) {
    var lines = String(markdownText || "").split(/\r?\n/);
    var inCode = false;
    var codeLang = "";
    var codeLines = [];
    var ulNode = null;
    var olNode = null;

    function flushCode() {
      if (!codeLines.length) {
        inCode = false;
        codeLang = "";
        return;
      }
      var pre = document.createElement("pre");
      var code = document.createElement("code");
      if (codeLang) {
        code.className = "language-" + codeLang;
      }
      code.textContent = codeLines.join("\n");
      pre.appendChild(code);
      container.appendChild(pre);
      inCode = false;
      codeLang = "";
      codeLines = [];
    }

    function closeLists() {
      ulNode = null;
      olNode = null;
    }

    for (var i = 0; i < lines.length; i += 1) {
      var raw = lines[i];
      var trim = raw.trim();

      // 处理代码块起止
      if (/^```/.test(trim)) {
        if (!inCode) {
          inCode = true;
          codeLang = trim.replace(/^```/, "").trim();
          closeLists();
        } else {
          flushCode();
        }
        continue;
      }

      if (inCode) {
        codeLines.push(raw);
        continue;
      }

      // 空行：断开段落与列表
      if (!trim) {
        closeLists();
        continue;
      }

      // 无序列表
      var ulMatch = raw.match(/^\s*-\s+(.+)$/);
      if (ulMatch) {
        if (!ulNode) {
          closeLists();
          ulNode = document.createElement("ul");
          container.appendChild(ulNode);
        }
        var ulLi = document.createElement("li");
        ulLi.innerHTML = inlineFormat(ulMatch[1]);
        ulNode.appendChild(ulLi);
        continue;
      }

      // 有序列表
      var olMatch = raw.match(/^\s*\d+\.\s+(.+)$/);
      if (olMatch) {
        if (!olNode) {
          closeLists();
          olNode = document.createElement("ol");
          container.appendChild(olNode);
        }
        var olLi = document.createElement("li");
        olLi.innerHTML = inlineFormat(olMatch[1]);
        olNode.appendChild(olLi);
        continue;
      }

      closeLists();

      // 普通段落
      var p = document.createElement("p");
      p.innerHTML = inlineFormat(trim);
      container.appendChild(p);
    }

    if (inCode) {
      flushCode();
    }
  }

  /**
   * HTML 白名单净化，阻断不安全标签与属性
   */
  function sanitizeHtml(html) {
    var template = document.createElement("template");
    template.innerHTML = String(html || "");

    var allowedTags = {
      P: true,
      BR: true,
      STRONG: true,
      EM: true,
      CODE: true,
      PRE: true,
      BLOCKQUOTE: true,
      UL: true,
      OL: true,
      LI: true,
      H1: true,
      H2: true,
      H3: true,
      H4: true,
      H5: true,
      H6: true,
      TABLE: true,
      THEAD: true,
      TBODY: true,
      TR: true,
      TH: true,
      TD: true,
      A: true,
      HR: true,
    };

    var allowedAttrs = {
      A: { href: true, title: true, target: true, rel: true },
      CODE: { class: true },
      PRE: { class: true },
      TH: { colspan: true, rowspan: true, align: true },
      TD: { colspan: true, rowspan: true, align: true },
    };

    function isSafeHref(href) {
      if (!href) return false;
      var value = String(href).trim().toLowerCase();
      return (
        value.indexOf("http://") === 0 ||
        value.indexOf("https://") === 0 ||
        value.indexOf("mailto:") === 0 ||
        value.indexOf("./") === 0 ||
        value.indexOf("../") === 0 ||
        value.indexOf("#") === 0
      );
    }

    function walk(node) {
      var child = node.firstChild;
      while (child) {
        var next = child.nextSibling;

        if (child.nodeType === 1) {
          var tag = child.tagName;
          if (!allowedTags[tag]) {
            // 不在白名单：保留文本，去掉标签
            while (child.firstChild) {
              node.insertBefore(child.firstChild, child);
            }
            node.removeChild(child);
            child = next;
            continue;
          }

          // 属性白名单
          var attrs = child.attributes;
          for (var i = attrs.length - 1; i >= 0; i -= 1) {
            var attrName = attrs[i].name.toLowerCase();
            var perTag = allowedAttrs[tag] || {};
            var allowed = !!perTag[attrName];

            // 屏蔽事件属性与 style
            if (attrName.indexOf("on") === 0 || attrName === "style") {
              allowed = false;
            }

            if (!allowed) {
              child.removeAttribute(attrs[i].name);
              continue;
            }

            if (tag === "A" && attrName === "href") {
              if (!isSafeHref(attrs[i].value)) {
                child.removeAttribute("href");
              }
            }
          }
        }

        walk(child);
        child = next;
      }
    }

    walk(template.content);
    return template.innerHTML;
  }

  /**
   * 统一链接行为：外链新窗口打开
   */
  function normalizeLinks(container) {
    var links = container.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i += 1) {
      var href = links[i].getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        links[i].setAttribute("target", "_blank");
        links[i].setAttribute("rel", "noopener noreferrer");
      }
    }
  }

  /**
   * 行内格式：仅处理 code 与加粗，控制复杂度
   */
  function inlineFormat(text) {
    var escaped = escapeHtml(String(text || ""));
    return escaped
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  /**
   * 转义 HTML，防止注入
   */
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
