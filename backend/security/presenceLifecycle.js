/** Order presence writes by verified UID; this module never opens a database. */
function createPresenceLifecycle({ getPlayerId, presenceService }) {
  const identities = new Map();

  function enqueue(entry, action) {
    const task = entry.tail.catch(() => {}).then(action);
    entry.tail = task;
    const cleanup = () => {
      if (entry.tail === task && entry.members.size === 0 && identities.get(entry.uid) === entry) {
        identities.delete(entry.uid);
      }
    };
    task.then(cleanup, cleanup);
    return task;
  }

  async function publish(entry) {
    if (!entry.playerId) return;
    const active = [...entry.members.values()].filter(({ socket }) => socket.connected && socket.uid === entry.uid);
    if (!active.length) {
      if (entry.online) {
        await presenceService.setOffline(entry.playerId);
        entry.online = false;
      }
      return;
    }
    const playing = active.find(member => member.gameId);
    // Assign before awaiting so a disconnect queues its offline write after this one.
    entry.online = true;
    if (playing) await presenceService.setInGame(entry.playerId, playing.gameId);
    else await presenceService.setOnline(entry.playerId);
  }

  function online(socket) {
    const uid = socket.uid;
    if (!uid || !socket.connected) return Promise.resolve();
    let entry = identities.get(uid);
    if (!entry) {
      entry = { uid, members: new Map(), tail: Promise.resolve(), playerId: null, online: false };
      identities.set(uid, entry);
    }
    if (entry.members.get(socket.id)?.socket !== socket) {
      entry.members.set(socket.id, { socket, gameId: null });
    }
    return enqueue(entry, async () => {
      if (!entry.playerId) entry.playerId = await getPlayerId(uid);
      if (entry.members.get(socket.id)?.socket !== socket || !socket.connected) return;
      socket.firebasePlayerId = entry.playerId;
      await publish(entry);
    });
  }

  function inGame(socket, gameId) {
    const entry = identities.get(socket.uid);
    const member = entry?.members.get(socket.id);
    if (member?.socket !== socket || !socket.connected) return Promise.resolve();
    member.gameId = gameId || null;
    return enqueue(entry, () => publish(entry));
  }

  function disconnect(socket) {
    const entry = identities.get(socket.uid);
    if (entry?.members.get(socket.id)?.socket !== socket) return Promise.resolve();
    entry.members.delete(socket.id);
    return enqueue(entry, () => publish(entry));
  }

  return { online, inGame, disconnect };
}

module.exports = { createPresenceLifecycle };
