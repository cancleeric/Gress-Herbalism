/**
 * Socket.io 測試客戶端輔助工具
 * 工單 0064
 */

const { io } = require('socket.io-client');

/**
 * 建立測試用 Socket 客戶端
 * @param {string} serverUrl - 伺服器 URL
 * @returns {Promise<Socket>} Socket 客戶端
 */
function createTestClient(serverUrl) {
  return new Promise((resolve, reject) => {
    const client = io(serverUrl, {
      transports: ['websocket'],
      forceNew: true,
      timeout: 5000,
    });

    const timer = setTimeout(() => {
      client.disconnect();
      reject(new Error('Connection timeout'));
    }, 5000);

    client.on('connect', () => {
      clearTimeout(timer);
      resolve(client);
    });

    client.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * 等待特定事件
 * @param {Socket} client - Socket 客戶端
 * @param {string} eventName - 事件名稱
 * @param {number} timeout - 超時時間（毫秒）
 * @returns {Promise<any>} 事件資料
 */
function waitForEvent(client, eventName, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    client.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/**
 * 建立多個測試客戶端
 * @param {string} serverUrl - 伺服器 URL
 * @param {number} count - 客戶端數量
 * @returns {Promise<Socket[]>} Socket 客戶端陣列
 */
async function createMultipleClients(serverUrl, count) {
  const clients = [];
  for (let i = 0; i < count; i++) {
    const client = await createTestClient(serverUrl);
    clients.push(client);
  }
  return clients;
}

/**
 * 斷開所有客戶端連線
 * @param {Socket[]} clients - Socket 客戶端陣列
 */
function disconnectAll(clients) {
  clients.forEach((client) => {
    if (client.connected) {
      client.disconnect();
    }
  });
}

/**
 * 建立 Mock Socket 物件（用於單元測試）
 */
function createMockSocket(id = 'test-socket-id') {
  return {
    id,
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn(() => ({ emit: jest.fn() })),
    broadcast: {
      to: jest.fn(() => ({ emit: jest.fn() })),
      emit: jest.fn(),
    },
    rooms: new Set([id]),
    data: {},
    disconnect: jest.fn(),
  };
}

module.exports = {
  createTestClient,
  waitForEvent,
  createMultipleClients,
  disconnectAll,
  createMockSocket,
};
