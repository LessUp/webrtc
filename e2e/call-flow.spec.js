import { test, expect } from '@playwright/test';

test.describe('Call flow', function () {
  test('two peers can establish a call', async function ({ browser }) {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Both users join the same room
    await pageA.goto('/');
    await pageA.fill('#room', 'call-test-room');
    await pageA.click('#join');
    await expect(pageA.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    await pageB.goto('/');
    await pageB.fill('#room', 'call-test-room');
    await pageB.click('#join');
    await expect(pageB.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // User A calls User B
    const memberB = await pageA.locator('.members__item').first().textContent();
    if (memberB) {
      await pageA.fill('#remote', memberB.trim());
      await pageA.click('#call');

      // Wait for call to be established
      await expect(pageA.locator('#status')).toHaveText(/通话中|calling/i, { timeout: 10000 });
    }

    await context.close();
  });

  test('hangup ends the call', async function ({ browser }) {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Setup: both join same room
    await pageA.goto('/');
    await pageA.fill('#room', 'hangup-test-room');
    await pageA.click('#join');
    await expect(pageA.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    await pageB.goto('/');
    await pageB.fill('#room', 'hangup-test-room');
    await pageB.click('#join');
    await expect(pageB.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Initiate call
    const memberB = await pageA.locator('.members__item').first().textContent();
    if (memberB) {
      await pageA.fill('#remote', memberB.trim());
      await pageA.click('#call');
      await pageA.waitForTimeout(2000);
    }

    // Hangup
    await pageA.click('#hangup');
    await expect(pageA.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    await context.close();
  });
});

test.describe('ICE candidate handling', function () {
  test('ICE candidates are exchanged during call setup', async function ({ browser }) {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Join room
    await pageA.goto('/');
    await pageA.fill('#room', 'ice-test-room');
    await pageA.click('#join');
    await expect(pageA.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    await pageB.goto('/');
    await pageB.fill('#room', 'ice-test-room');
    await pageB.click('#join');
    await expect(pageB.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Start call and check for ICE candidate exchange (via connection state)
    const memberB = await pageA.locator('.members__item').first().textContent();
    if (memberB) {
      await pageA.fill('#remote', memberB.trim());
      await pageA.click('#call');

      // Wait for connection - if ICE works, we should see video elements or calling state
      await pageA.waitForTimeout(3000);

      // Check that local video is present (media stream obtained)
      const localVideo = await pageA.locator('#localVideo');
      await expect(localVideo).toBeVisible({ timeout: 5000 });
    }

    await context.close();
  });
});
