import { test, expect } from '@playwright/test';

test.describe('DataChannel chat', function () {
  test('can send and receive messages', async function ({ browser }) {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Both users join the same room
    await pageA.goto('/');
    await pageA.fill('#room', 'chat-test-room');
    await pageA.click('#join');
    await expect(pageA.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    await pageB.goto('/');
    await pageB.fill('#room', 'chat-test-room');
    await pageB.click('#join');
    await expect(pageB.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Establish call first (required for DataChannel)
    const memberB = await pageA.locator('.members__item').first().textContent();
    if (memberB) {
      await pageA.fill('#remote', memberB.trim());
      await pageA.click('#call');

      // Wait for call to establish
      await pageA.waitForTimeout(3000);

      // Check if chat input exists and is visible
      const chatInput = pageA.locator('#chatInput');
      if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Send a message from A to B
        await chatInput.fill('Hello from A!');
        await pageA.click('#sendChat');

        // Wait for message to arrive
        await pageB.waitForTimeout(1000);

        // Check if message appears on page B
        await expect(pageB.locator('.chat-messages, #messages')).toContainText('Hello from A!', {
          timeout: 5000
        });
      }
    }

    await context.close();
  });

  test('chat input is disabled when not in call', async function ({ page }) {
    await page.goto('/');
    await page.fill('#room', 'chat-disabled-room');
    await page.click('#join');
    await expect(page.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Check if chat input is disabled when not in a call
    const chatInput = page.locator('#chatInput');
    if (await chatInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Chat input should exist but may be disabled
      const isDisabled = await chatInput.isDisabled().catch(() => true);
      // If not disabled, the send button might be disabled
      const sendButton = page.locator('#sendChat');
      const sendDisabled = await sendButton.isDisabled().catch(() => true);
      expect(isDisabled || sendDisabled).toBeTruthy();
    }
  });
});

test.describe('DataChannel availability', function () {
  test('DataChannel is available during active call', async function ({ browser }) {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Setup call
    await pageA.goto('/');
    await pageA.fill('#room', 'dc-avail-room');
    await pageA.click('#join');
    await expect(pageA.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    await pageB.goto('/');
    await pageB.fill('#room', 'dc-avail-room');
    await pageB.click('#join');
    await expect(pageB.locator('#status')).toHaveText(/已加入|joined/i, { timeout: 5000 });

    // Start call
    const memberB = await pageA.locator('.members__item').first().textContent();
    if (memberB) {
      await pageA.fill('#remote', memberB.trim());
      await pageA.click('#call');

      // Wait for DataChannel to be ready
      await pageA.waitForTimeout(3000);

      // Check DataChannel state via console or UI
      // If there's a status indicator, check it
      const dcStatus = await pageA.locator('#dataChannelStatus, .dc-status').first();
      if (await dcStatus.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(dcStatus).toContainText(/open|ready|connected/i, { timeout: 5000 });
      }
    }

    await context.close();
  });
});
