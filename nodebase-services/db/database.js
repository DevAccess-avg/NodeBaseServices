const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname);
const usersFile = path.join(dataDir, 'users.json');
const ordersFile = path.join(dataDir, 'orders.json');

function ensureFiles() {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]', 'utf8');
  }
  if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, '[]', 'utf8');
  }
}

ensureFiles();

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
}

const db = {
  getUser(discordId) {
    return readUsers().find(u => u.discord_id === discordId) || null;
  },

  upsertUser(profile, accessToken, refreshToken) {
    const users = readUsers();
    const idx = users.findIndex(u => u.discord_id === profile.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      users[idx] = {
        ...users[idx],
        username: profile.username,
        discriminator: profile.discriminator || '0',
        avatar: profile.avatar,
        email: profile.email || null,
        access_token: accessToken,
        refresh_token: refreshToken,
        last_login: now
      };
      writeUsers(users);
      return users[idx];
    } else {
      const newUser = {
        discord_id: profile.id,
        username: profile.username,
        discriminator: profile.discriminator || '0',
        avatar: profile.avatar,
        email: profile.email || null,
        access_token: accessToken,
        refresh_token: refreshToken,
        suspended: 0,
        created_at: now,
        last_login: now
      };
      users.push(newUser);
      writeUsers(users);
      return newUser;
    }
  },

  getAllUsers() {
    return readUsers().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  setSuspended(discordId, suspended) {
    const users = readUsers();
    const u = users.find(x => x.discord_id === discordId);
    if (u) {
      u.suspended = suspended ? 1 : 0;
      writeUsers(users);
      return true;
    }
    return false;
  },

  createOrder({ code, user_id, service_type, bot_type, custom_details }) {
    const orders = readOrders();
    const order = {
      id: orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1,
      code,
      user_id,
      service_type,
      bot_type,
      custom_details: custom_details || null,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    orders.push(order);
    writeOrders(orders);
    return order;
  },

  codeExists(code) {
    return readOrders().some(o => o.code === code);
  },

  getAllOrders() {
    const orders = readOrders();
    const users = readUsers();
    return orders
      .map(o => {
        const u = users.find(x => x.discord_id === o.user_id);
        return { ...o, username: u ? u.username : null };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  updateOrderStatus(id, status) {
    const orders = readOrders();
    const o = orders.find(x => x.id === Number(id));
    if (o) {
      o.status = status;
      writeOrders(orders);
      return true;
    }
    return false;
  }
};

module.exports = db;
