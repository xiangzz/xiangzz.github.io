#!/usr/bin/env node
/**
 * DBLP 论文同步脚本
 * --------------------------------------------------
 * 服务端运行（GitHub Action 或本地 Node），抓取 DBLP PID JSON，
 * 转换为 publications.json 供前端动态渲染发表论文列表。
 *
 * 用法： node scripts/sync-dblp.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// DBLP 个人主页的 PID（持久标识符），永不过期
const DBLP_PID = '167/2211';
// DBLP 的 PID 页面只支持 XML/BibTeX，不直接提供 JSON。
// 因此改用官方 search API 的 JSON 格式（按作者精确匹配），返回结构同为 result.hits.hit。
const DBLP_URL = `https://dblp.org/search/publ/api?q=author%3AZhengzhe_Xiang%3A&format=json&h=1000`;
const OUTPUT_PATH = path.join(__dirname, '..', 'publications.json');
// 前端渲染时需高亮的本人姓名
const SELF_NAME = 'Zhengzhe Xiang';
// 是否包含 arXiv 等非正式预印本（DBLP 中 type 为 "Informal and Other Publications"）。
// 学术主页通常只展示正式发表的论文，因此默认排除；如需显示改为 true。
const INCLUDE_PREPRINTS = false;

/**
 * 规范化作者字段
 * DBLP 的 authors.author 可能是：单个字符串、单个对象、或对象数组
 */
function normalizeAuthors(authorField) {
    if (!authorField) return [];
    const arr = Array.isArray(authorField) ? authorField : [authorField];
    return arr.map(a => (typeof a === 'string' ? a : a.text)).filter(Boolean);
}

/**
 * 解码 HTML 实体
 * DBLP 的 JSON 文本字段已被 HTML 实体编码（如 & 写成 &amp;），
 * 这里还原成原始字符，存储干净数据，由前端在渲染时统一转义。
 */
function decodeEntities(s) {
    if (!s) return '';
    return String(s)
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&'); // 放最后，避免误伤上面的实体
}

/** 发起 HTTPS 请求并解析 JSON */
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'xiangzz.github.io dblp-sync' } }, (res) => {
            // 处理重定向（DBLP 偶尔会 301）
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetchJSON(res.headers.location));
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`DBLP 返回状态码 ${res.statusCode}`));
            }
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('解析 DBLP JSON 失败：' + e.message));
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => req.destroy(new Error('请求 DBLP 超时')));
    });
}

async function main() {
    console.log('正在抓取 DBLP 数据：', DBLP_URL);
    const raw = await fetchJSON(DBLP_URL);

    // hit 在只有一条记录时是对象，多条时是数组，统一成数组
    const hits = [].concat((raw && raw.result && raw.result.hits && raw.result.hits.hit) || []);
    console.log(`获取到 ${hits.length} 条记录`);

    const publications = hits.map(hit => {
        const info = (hit && hit.info) || {};
        return {
            authors: normalizeAuthors(info.authors && info.authors.author).map(decodeEntities),
            title: decodeEntities(info.title || ''),
            venue: decodeEntities(info.venue || ''),
            year: info.year || '',
            volume: info.volume || '',
            number: info.number || '',
            pages: info.pages || '',
            type: info.type || '',
            url: info.ee || info.url || ''
        };
    })
        // 按配置过滤掉非正式预印本
        .filter(p => INCLUDE_PREPRINTS || p.type.indexOf('Informal') === -1)
        // 按年份降序，便于前端直接展示
        .sort((a, b) => String(b.year).localeCompare(String(a.year)));

    const output = {
        lastSynced: new Date().toISOString(),
        source: `https://dblp.org/pid/${DBLP_PID}.html`,
        selfName: SELF_NAME,
        publications
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`已写入 ${OUTPUT_PATH}（共 ${publications.length} 篇）`);
}

main().catch(err => {
    console.error('同步失败：', err.message);
    process.exit(1);
});
