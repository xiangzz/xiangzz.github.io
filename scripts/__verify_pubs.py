from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    logs = []
    page.on("console", lambda msg: logs.append(f"{msg.type}: {msg.text}"))
    page.on("pageerror", lambda err: logs.append(f"pageerror: {err}"))

    page.goto('http://localhost:8011/#publications')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)

    # 统计渲染出的年份分组
    groups = page.locator('#pubContainer .pub-year-group').all()
    print('年份分组数量:', len(groups))

    # 打印每个年份的标题与篇数
    for g in groups:
        year = g.locator('.pub-year-num').inner_text()
        count = g.locator('.pub-year-count').inner_text()
        expanded = g.locator('.pub-year-toggle').get_attribute('aria-expanded')
        print(f'  {year} | {count} | expanded={expanded}')

    # 最新年份默认展开，应能看到 pub-item
    items = page.locator('#pubContainer .pub-item').all()
    print('可见/已渲染论文条目数:', len(items))

    # 打印第一条论文文本，确认格式（含加粗本人名）
    if items:
        print('第一条:', items[0].inner_text()[:160])

    page.screenshot(path='scripts/__pubs_screenshot.png', full_page=False)
    print('截图已保存: scripts/__pubs_screenshot.png')
    print('--- 控制台日志 ---')
    for l in logs:
        print(l)

    browser.close()
