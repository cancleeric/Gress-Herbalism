// PostgreSQL runtime DML only; never installs or applies the offline candidate.
function createReplayStore(db) {
  const table = name => db(name).withSchema('herbalism');
  async function append(f) {
    return db.transaction(async trx => {
      const t = name => trx(name).withSchema('herbalism');
      await t('game_history').insert({ game_id: f.gameId, match_id: f.matchId,
        replay_version: 1, engine_version: 'herbalism-v1', started_at: f.startedAt,
        replay_status: 'recording', player_count: f.seats.length }).onConflict('match_id').ignore();
      const head = await t('game_history').where({ match_id: f.matchId }).forUpdate().first();
      if (head.last_event_seq >= f.seq) {
        const previous = await t('game_events').where({ game_history_id: head.id, seq: f.seq }).first();
        if (previous?.event_id !== f.eventId) throw new Error('Replay conflict');
        return;
      }
      if (head.last_event_seq !== f.seq - 1) throw new Error('Replay gap');
      for (const s of f.seats) {
        await t('game_participants').insert({ game_history_id: head.id, seat_index: s.seat,
          firebase_uid: s.uid, player_name: s.name, final_score: 0, is_winner: false,
          is_ai: !s.uid }).onConflict(['game_history_id', 'seat_index']).ignore();
      }
      await t('game_events').insert({ game_history_id: head.id, seq: f.seq, event_id: f.eventId,
        event_version: 1, round_number: f.round, event_type: f.type,
        occurred_at: f.at, public_payload: f.payload });
      await t('game_snapshots').insert(f.views.map(v => ({ game_history_id: head.id,
        event_seq: f.seq, viewer_seat: v.seat, snapshot_version: 1, state: v.state })));
      const updates = { last_event_seq: f.seq, rounds_played: f.round };
      if (f.complete && head.replay_status !== 'complete') {
        Object.assign(updates, { replay_status: 'complete', finished_at: f.at,
          winner_name: f.seats.find(s => s.id === f.winner)?.name || null });
        for (const s of f.seats) {
          const score = f.scores[s.id] || 0;
          await t('game_participants').where({ game_history_id: head.id, seat_index: s.seat })
            .update({ final_score: score, is_winner: s.id === f.winner });
          if (s.uid) await t('players').where({ firebase_uid: s.uid }).update({
            total_score: trx.raw('COALESCE(total_score, 0) + ?', [score]),
            games_played: trx.raw('COALESCE(games_played, 0) + 1'),
            games_won: trx.raw('COALESCE(games_won, 0) + ?', [s.id === f.winner ? 1 : 0]) });
        }
      }
      await t('game_history').where({ id: head.id }).update(updates);
    });
  }
  async function history(uid) {
    const games = await table('game_history').whereIn('id',
      table('game_participants').select('game_history_id').where({ firebase_uid: uid }))
      .whereNotNull('match_id').orderBy('id', 'desc').limit(50);
    return Promise.all(games.map(async g => ({ matchId: g.match_id, status: g.replay_status,
      startedAt: g.started_at, winner: g.winner_name, rounds: g.rounds_played,
      participants: await table('game_participants').select('player_name', 'final_score', 'is_winner')
        .where({ game_history_id: g.id }).orderBy('seat_index') })));
  }
  async function replay(uid, matchId, after = 0) {
    const g = await table('game_history').where({ match_id: matchId }).first();
    if (!g) return null;
    const seat = await table('game_participants').where({ game_history_id: g.id, firebase_uid: uid }).first();
    if (!seat) return null;
    const frames = await table('game_snapshots').where({ game_history_id: g.id, viewer_seat: seat.seat_index })
      .andWhere('event_seq', '>', after).orderBy('event_seq').limit(100);
    const events = frames.length ? await table('game_events').where({ game_history_id: g.id })
      .whereIn('seq', frames.map(f => f.event_seq)).orderBy('seq') : [];
    return { status: g.replay_status, viewerSeat: seat.seat_index,
      frames: frames.map((f, i) => ({ seq: f.event_seq, state: f.state,
        type: events[i].event_type, round: events[i].round_number, at: events[i].occurred_at,
        payload: events[i].public_payload })),
      next: frames.length === 100 ? frames[frames.length - 1].event_seq : null };
  }
  return { append, history, replay };
}
module.exports = { createReplayStore };
