import { test, expect } from '@playwright/test';

test.describe('Room lifecycle', function () {
  test('join room → shows joined status and own ID', async function ({ page }) {
    await page.goto('/');
    await page.fill('#room', 'test-room');
    await page.click('#join');

    await expect(page.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });
    await expect(page.locator('#myId')).not.toBeEmpty();
    await expect(page.locator('#join')).toHaveText('Leave');
  });

  test('join with empty room name shows error', async function ({ page }) {
    await page.goto('/');
    await page.click('#join');

    await expect(page.locator('#error')).toHaveText(/房间名/i, { timeout: 3000 });
  });

  test('leave room → returns to idle state', async function ({ page }) {
    await page.goto('/');
    await page.fill('#room', 'test-room');
    await page.click('#join');

    await expect(page.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    await page.click('#join'); // Leave button
    await expect(page.locator('#status')).toHaveText(/未连接|idle/i, { timeout: 5000 });
    await expect(page.locator('#join')).toHaveText('Join');
    await expect(page.locator('#members')).toHaveText(/暂无成员/);
  });

  test('two tabs see each other in members list', async function ({ browser }) {
    var context = await browser.newContext();
    var pageA = await context.newPage();
    var pageB = await context.newPage();

    await pageA.goto('/');
    await pageA.fill('#room', 'shared-room');
    await pageA.click('#join');
    await expect(pageA.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });
    var idA = await pageA.locator('#myId').textContent();

    await pageB.goto('/');
    await pageB.fill('#room', 'shared-room');
    await pageB.click('#join');
    await expect(pageB.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Both tabs should see each other
    await expect(pageA.locator('.members__list')).toContainText(idA, { timeout: 5000 });
    await expect(pageB.locator('.members__list')).toContainText(idA, { timeout: 5000 });

    await context.close();
  });
});
