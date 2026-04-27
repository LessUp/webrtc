import { test, expect } from '@playwright/test';

test.describe('WebSocket reconnection', function () {
  test('shows reconnecting state when connection is lost', async function ({ page, context }) {
    await page.goto('/');
    await page.fill('#room', 'reconnect-test-room');
    await page.click('#join');
    await expect(page.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Simulate connection loss by going offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Should show reconnecting or error state
    await expect(page.locator('#error, #status')).toContainText(/重连|reconnect|断开|disconnect|error/i, {
      timeout: 10000
    });

    // Restore connection
    await context.setOffline(false);
  });

  test('reconnects automatically when connection is restored', async function ({ page, context }) {
    await page.goto('/');
    await page.fill('#room', 'reconnect-auto-room');
    await page.click('#join');
    await expect(page.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Go offline briefly
    await context.setOffline(true);
    await page.waitForTimeout(2000);

    // Restore connection
    await context.setOffline(false);

    // Should eventually reconnect
    await expect(page.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 15000 });
  });
});

test.describe('Connection state handling', function () {
  test('handles page reload gracefully', async function ({ page }) {
    await page.goto('/');
    await page.fill('#room', 'reload-test-room');
    await page.click('#join');
    await expect(page.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Get the user ID
    const userId = await page.locator('#myId').textContent();

    // Reload the page
    await page.reload();

    // Should be in idle state after reload
    await expect(page.locator('#status')).toHaveText(/未连接|idle/i, { timeout: 5000 });

    // Rejoin with same room
    await page.fill('#room', 'reload-test-room');
    await page.click('#join');
    await expect(page.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Should have a new user ID after reload
    const newUserId = await page.locator('#myId').textContent();
    expect(newUserId).toBeTruthy();
  });

  test('handles rapid join/leave cycles', async function ({ page }) {
    await page.goto('/');

    for (let i = 0; i < 3; i++) {
      await page.fill('#room', `rapid-test-room-${i}`);
      await page.click('#join');
      await expect(page.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

      await page.click('#join'); // Leave
      await expect(page.locator('#status')).toHaveText(/未连接|idle/i, { timeout: 5000 });
    }
  });
});
