/**
 * 可观察对象模块
 *
 * 提供状态订阅机制，用于状态管理器复用。
 */

/**
 * 创建可观察对象
 * @returns {Object} 包含 subscribe 和 notify 方法的对象
 */
export function createObservable() {
  var subscribers = new Set();
  var notifying = false;

  /**
   * 订阅状态变化
   * @param {Function} fn - 回调函数
   * @returns {Function} 取消订阅函数
   */
  function subscribe(fn) {
    subscribers.add(fn);
    return function unsubscribe() {
      subscribers.delete(fn);
    };
  }

  /**
   * 通知所有订阅者
   * 包含重入保护，防止 notify 循环
   */
  function notify() {
    if (notifying) {
      return;
    }
    notifying = true;
    try {
      subscribers.forEach(function (fn) {
        fn();
      });
    } finally {
      notifying = false;
    }
  }

  /**
   * 获取订阅者数量
   * @returns {number}
   */
  function subscriberCount() {
    return subscribers.size;
  }

  return {
    subscribe: subscribe,
    notify: notify,
    subscriberCount: subscriberCount
  };
}
