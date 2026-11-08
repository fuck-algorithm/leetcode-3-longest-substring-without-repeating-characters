import { expect, test, type Page } from '@playwright/test';

/**
 * 通用验收用例：不得写死某道题的样例值或变量名。
 * 题目专属断言请新增用例，不要删除或弱化这里的通用用例。
 */

async function gotoHome(page: Page) {
  await page.goto('');
  await expect(page.getByTestId('app-root')).toBeVisible();
}

function parseStepText(text: string): { current: number; total: number } {
  const match = text.match(/(?:Step|步骤)\s+(\d+)\s*\/\s*(\d+)/i);
  if (!match) {
    throw new Error(`无法解析步骤文本: ${text}`);
  }
  return { current: Number(match[1]), total: Number(match[2]) };
}

test.describe('Algorithm Visualization Acceptance', () => {
  test('E2E-016 双语 UI 文案完整覆盖', async ({ page }) => {
    await gotoHome(page);
    const english = page.getByTestId('ui-language-en');
    const chinese = page.getByTestId('ui-language-zh-CN');
    await expect(english).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('problem-title-link')).toContainText(/LeetCode .*\./);
    await expect(page.getByTestId('thought-btn')).toHaveText('Algorithm');
    await expect(page.getByTestId('timeline-meta')).toContainText('Step');
    await page.getByTestId('sample-s1').click();
    await expect(page.getByTestId('legend-title')).toHaveText('Legend');
    await expect(page.getByTestId('canvas-legend')).toBeVisible();
    await expect(page.getByTestId('canvas-input-echo')).toContainText('Input:');

    await expect(page.getByTestId('sample-s2')).toContainText('bbbbb');
    await expect(page.getByTestId('random-input-btn')).toContainText(/Random|随机/);
    await expect(page.getByTestId('next-step-btn')).toContainText(/Next|下一步/);
    await expect(page.getByTestId('legend-title')).toHaveText(/Legend|图例/);

    await chinese.click();
    await expect(chinese).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.getByTestId('thought-btn')).toHaveText('算法思路');
    await expect(page.getByTestId('random-input-btn')).toHaveText('随机合法数据');
    await expect(page.getByTestId('legend-title')).toHaveText('图例');
  });

  test('E2E-001 首屏单屏布局与关键元素可见', async ({ page }) => {
    await gotoHome(page);
    await expect(page.getByTestId('ui-language-en')).toHaveAttribute('aria-pressed', 'true');
    for (const id of [
      'problem-header', 'data-input-bar', 'visualization-canvas', 'step-narration',
      'canvas-legend', 'operation-badge', 'code-panel', 'playback-controls'
    ]) {
      await expect(page.getByTestId(id)).toBeVisible();
    }

    const viewports = [
      { width: 1920, height: 1080, chrome: 0.22, canvas: 0.76, svg: 0.66, share: 0.7 },
      { width: 1366, height: 768, chrome: 0.26, canvas: 0.62, svg: 0.5, share: 0.68 }
    ];
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const layout = await page.evaluate(() => {
        const rect = (id: string) => document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect();
        const header = rect('problem-header');
        const input = rect('data-input-bar');
        const tabs = rect('solution-tabs');
        const controls = rect('playback-controls');
        const canvas = rect('visualization-canvas');
        const svg = rect('canvas-svg');
        const code = rect('code-panel');
        return {
          header: header?.height ?? 0,
          chrome: ((header?.height ?? 0) + (input?.height ?? 0) + (tabs?.height ?? 0) + (controls?.height ?? 0)) / innerHeight,
          canvas: (canvas?.height ?? 0) / innerHeight,
          svg: (svg?.height ?? 0) / innerHeight,
          share: (canvas?.width ?? 0) / ((canvas?.width ?? 0) + (code?.width ?? 0)),
          scroll: document.documentElement.scrollHeight
        };
      });
      expect(layout.header).toBeLessThanOrEqual(52);
      expect(layout.chrome).toBeLessThanOrEqual(viewport.chrome + 0.005);
      expect(layout.canvas).toBeGreaterThanOrEqual(viewport.canvas);
      expect(layout.svg).toBeGreaterThanOrEqual(viewport.svg);
      expect(layout.share).toBeGreaterThanOrEqual(viewport.share);
      expect(layout.scroll).toBeLessThanOrEqual(viewport.height + 4);
    }
  });

  test('E2E-002 顶部题目、Hot100、GitHub 外链正确', async ({ page }) => {
    await gotoHome(page);
    await expect(page.getByTestId('problem-title-link')).toContainText(/LeetCode .*\./);
    await expect(page.getByTestId('problem-title-link')).toHaveAttribute('target', '_blank');
    await expect(page.getByTestId('hot100-link')).toHaveAttribute('href', /leetcode-hot-100/);
    await expect(page.getByTestId('hot100-link')).toHaveAttribute('target', '_blank');
    await expect(page.getByTestId('github-badge')).toHaveAttribute('target', '_blank');
    await expect(page.getByTestId('github-stars')).toContainText(/\d+/);
  });

  test('E2E-003 非法输入不触发重算，合法输入重算', async ({ page }) => {
    await gotoHome(page);
    const input = page.getByTestId('algo-input');
    const before = await page.getByTestId('timeline-meta').innerText();
    await input.fill('x'.repeat(50001));
    await input.press('Enter');
    await input.evaluate((element: HTMLInputElement) => element.blur());
    await expect(page.getByTestId('input-error')).toBeVisible();
    await expect(page.getByTestId('timeline-meta')).toHaveText(before);
    await page.locator('[data-testid^="sample-"]').first().click();
    await expect(page.getByTestId('input-error')).toHaveCount(0);
  });

  test('E2E-004 样例和随机输入可用', async ({ page }) => {
    await gotoHome(page);
    await page.locator('[data-testid^="sample-"]').first().click();
    await expect(page.getByTestId('visualization-canvas')).toBeVisible();
    await page.getByTestId('random-input-btn').click();
    await expect(page.getByTestId('algo-input')).not.toHaveValue('');
  });

  test('E2E-005 界面语言偏好刷新后保留', async ({ page }) => {
    await gotoHome(page);
    await page.getByTestId('ui-language-zh-CN').click();
    await expect(page.locator('[data-testid="app-root"]')).toHaveAttribute('lang', 'zh-CN');
    await page.reload();
    await expect(page.locator('[data-testid="app-root"]')).toHaveAttribute('lang', 'zh-CN');
  });

  test('E2E-006 代码、解说和焦点随步骤同步', async ({ page }) => {
    await gotoHome(page);
    const before = await page.getByTestId('step-narration').innerText();
    await page.getByTestId('next-step-btn').click();
    await expect(page.getByTestId('step-narration')).not.toHaveText(before);
    await expect(page.locator('[data-status="current"]')).toHaveCount(1);
  });

  test('E2E-007 Left/Right/Space/R 快捷键有效', async ({ page }) => {
    await gotoHome(page);
    const step = page.getByTestId('timeline-meta');
    const initial = parseStepText(await step.innerText());
    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => parseStepText(await step.innerText()).current).toBe(initial.current + 1);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(async () => parseStepText(await step.innerText()).current).toBe(initial.current);
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await page.keyboard.press('R');
    await expect.poll(async () => parseStepText(await step.innerText()).current).toBe(1);
  });

  test('E2E-008 进度条可以拖拽跳步', async ({ page }) => {
    await gotoHome(page);
    const track = page.getByTestId('timeline-track');
    const box = await track.boundingBox();
    if (!box) throw new Error('timeline track is not visible');
    const total = parseStepText(await page.getByTestId('timeline-meta').innerText()).total;
    await track.dispatchEvent('mousedown', { clientX: box.x + box.width - 2, clientY: box.y + box.height / 2 });
    await expect.poll(async () => parseStepText(await page.getByTestId('timeline-meta').innerText()).current)
      .toBe(total);
  });

  test('E2E-009 画布支持平移和缩放', async ({ page }) => {
    await gotoHome(page);
    const svg = page.getByTestId('canvas-svg');
    const before = await svg.locator('g').first().getAttribute('transform');
    const box = await svg.boundingBox();
    if (!box) throw new Error('canvas SVG is not visible');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -300);
    await expect.poll(() => svg.locator('g').first().getAttribute('transform')).not.toBe(before);
  });

  test('E2E-010 思路弹窗可以打开关闭', async ({ page }) => {
    await gotoHome(page);
    await page.getByTestId('thought-btn').click();
    await expect(page.getByTestId('thought-modal')).toBeVisible();
    await page.getByTestId('thought-modal-close').click();
    await expect(page.getByTestId('thought-modal')).toBeHidden();
  });

  test('E2E-011 多解法切换时隔离步骤', async ({ page }) => {
    await gotoHome(page);
    const tabs = page.locator('[data-testid^="solution-tab-"]');
    if (await tabs.count() < 2) {
      test.skip(true, '单解法项目没有解法切换分支');
    }
    const first = await page.getByTestId('timeline-meta').innerText();
    await tabs.nth(1).click();
    await expect(page.getByTestId('timeline-meta')).not.toHaveText(first);
  });

  test('E2E-012 社群浮层显示且二维码不变形', async ({ page }) => {
    await gotoHome(page);
    await page.getByTestId('community-btn').hover();
    await expect(page.getByTestId('community-pop')).toBeVisible();
    const ratio = await page.locator('[data-testid="community-qr"]').evaluate((image: HTMLImageElement) =>
      Math.abs(image.naturalWidth / image.naturalHeight - image.clientWidth / image.clientHeight)
    );
    expect(ratio).toBeLessThan(0.02);
  });

  test('E2E-013 速度偏好刷新后保留', async ({ page }) => {
    await gotoHome(page);
    await page.getByTestId('speed-2x').click();
    await page.reload();
    await expect(page.getByTestId('speed-2x')).toHaveClass(/active/);
  });

  test('E2E-014 GitHub Star 缓存、失败回退与 30 分钟退避', async ({ page }) => {
    await page.clock.install({ now: Date.parse('2026-01-01T00:00:00Z') });
    let apiCalls = 0;
    await page.route('https://api.github.com/repos/**', async (route) => {
      apiCalls += 1;
      await route.fulfill(apiCalls === 1
        ? { json: { stargazers_count: 42 } }
        : { status: 403, json: { message: 'rate limited' } });
    });
    await gotoHome(page);
    const stars = page.getByTestId('problem-header').getByTestId('github-stars');
    await expect(stars).toHaveText('⭐ 42');
    expect(apiCalls).toBe(1);
    await page.reload();
    await expect(stars).toHaveText('⭐ 42');
    expect(apiCalls).toBe(1);
    await page.clock.fastForward(30 * 60 * 1000 + 1);
    await page.reload();
    await expect.poll(() => apiCalls).toBe(2);
    await page.reload();
    expect(apiCalls).toBe(2);
    await page.clock.fastForward(30 * 60 * 1000 + 1);
    await page.reload();
    await expect.poll(() => apiCalls).toBe(3);
  });

  test('E2E-015 无紫色主题 token', async ({ page }) => {
    await gotoHome(page);
    const hasPurple = await page.evaluate(() => Array.from(document.styleSheets).some((sheet) => {
      try {
        return Array.from((sheet as CSSStyleSheet).cssRules).some((rule) =>
          /purple|#800080|#7e22ce/i.test(rule.cssText)
        );
      } catch {
        return false;
      }
    }));
    expect(hasPurple).toBe(false);
  });

  test('E2E-017 首访 English、偏好记忆与演示状态保持', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('[data-testid="app-root"]')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('ui-language-en')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('problem-title-link')).toContainText(/LeetCode .*/);
    await expect(page.getByTestId('thought-btn')).toHaveText('Algorithm');
    await expect(page.getByTestId('timeline-meta')).toContainText('Step');
    await page.getByTestId('sample-s1').click();
    await expect(page.getByTestId('sample-s2')).toContainText('bbbbb');
    await expect(page.getByTestId('random-input-btn')).toContainText(/Random|随机/);
    await expect(page.getByTestId('legend-title')).toHaveText(/Legend|图例/);
    await expect(page.getByTestId('canvas-input-echo')).toContainText(/Input|当前输入/);
    const input = page.getByTestId('algo-input');
    await input.fill('pwwkew');
    await input.evaluate((element: HTMLInputElement) => element.blur());
    await expect(input).toHaveValue('pwwkew');
    const originalInput = await input.inputValue();
    await page.getByTestId('next-step-btn').click();
    await page.getByTestId('next-step-btn').click();
    const originalStep = parseStepText(await page.getByTestId('timeline-meta').innerText()).current;
    await page.getByTestId('thought-btn').click();
    const canvas = page.locator('[data-testid="canvas-svg"] g.zoom-layer');
    const canvasSvg = page.getByTestId('canvas-svg');
    await expect(canvas).toHaveAttribute('transform', /translate\(0,0\) scale\(1\)/);
    const canvasBox = await canvasSvg.boundingBox();
    if (!canvasBox) throw new Error('canvas SVG is not visible');
    await canvasSvg.dispatchEvent('wheel', {
      deltaY: -240,
      clientX: canvasBox.x + canvasBox.width / 2,
      clientY: canvasBox.y + canvasBox.height / 2,
      bubbles: true,
      cancelable: true
    });
    await expect.poll(() => canvas.getAttribute('transform')).not.toBe('translate(0,0) scale(1)');
    const canvasTransform = await canvas.getAttribute('transform');
    await page.getByTestId('ui-language-zh-CN').evaluate((button: HTMLButtonElement) => button.click());
    await expect(page.locator('[data-testid="app-root"]')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.getByTestId('thought-btn')).toHaveText('算法思路');
    await expect(page.getByTestId('sample-s2')).toHaveText('bbbbb');
    await expect(page.getByTestId('random-input-btn')).toHaveText('随机合法数据');
    await expect(page.getByTestId('legend-title')).toHaveText('图例');
    await expect(page.getByTestId('canvas-input-echo')).toContainText('当前输入');
    await expect(input).toHaveValue(originalInput);
    await expect.poll(async () =>
      parseStepText(await page.getByTestId('timeline-meta').innerText()).current
    ).toBe(originalStep);
    await expect(page.getByTestId('thought-modal')).toBeVisible();
    await expect(canvas).toHaveAttribute('transform', canvasTransform ?? '');
    await page.reload();
    await expect(page.locator('[data-testid="app-root"]')).toHaveAttribute('lang', 'zh-CN');
    await page.getByTestId('ui-language-en').click();
    await expect(page.locator('[data-testid="app-root"]')).toHaveAttribute('lang', 'en');
    await page.reload();
    await expect(page.locator('[data-testid="app-root"]')).toHaveAttribute('lang', 'en');
  });
});
