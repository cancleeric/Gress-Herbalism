// A bounded compatibility adapter for the query subset used by this game.
// Knex binds values and quotes identifiers; no raw statements or DDL are used.
const TABLES = new Set([
  'players', 'game_history', 'game_participants', 'friend_requests', 'friendships',
  'game_invitations', 'user_presence', 'evolution_games', 'evolution_participants',
  'evolution_player_stats', 'evolution_player_achievements', 'evolution_game_replays',
  'evolution_leaderboard', 'evolution_daily_leaderboard', 'evolution_weekly_leaderboard',
]);
const CONFLICT_KEYS = { user_presence: 'user_id', evolution_game_replays: 'game_id' };
const RELATIONS = {
  game_participants: { name: 'game_history', table: 'game_history', foreignKey: 'game_history_id' },
  evolution_participants: { name: 'game', table: 'evolution_games', foreignKey: 'game_id' },
};

function identifier(value) {
  if (typeof value !== 'string' || !/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error('Unsupported database identifier');
  }
  return value;
}

function splitList(text) {
  let depth = 0;
  let start = 0;
  const parts = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')') depth--;
    if (depth < 0 || depth > 4) throw new Error('Unsupported filter nesting');
    if (text[i] === ',' && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  if (depth !== 0) throw new Error('Unbalanced filter');
  parts.push(text.slice(start));
  if (parts.some(part => !part)) throw new Error('Empty filter');
  return parts;
}

function orFilters(expression) {
  if (typeof expression !== 'string' || expression.length > 4096) throw new Error('Unsupported filter');
  return splitList(expression).map(term => {
    if (term.startsWith('and(') && term.endsWith(')')) {
      return splitList(term.slice(4, -1)).map(equality);
    }
    return [equality(term)];
  });
}

function equality(term) {
  const match = /^([a-z_][a-z0-9_]*)\.eq\.([^(),]+)$/.exec(term);
  if (!match) throw new Error('Only equality OR filters are supported');
  return { column: identifier(match[1]), value: match[2] };
}

function projection(table, text = '*') {
  if (typeof text !== 'string') throw new Error('Invalid selection');
  const compact = text.replace(/\s/g, '');
  const columns = [];
  let relation = null;
  for (const part of splitList(compact)) {
    if (part.includes('(')) {
      const known = RELATIONS[table];
      const match = /^([a-z_][a-z0-9_]*)(?::([a-z_][a-z0-9_]*))?\(([^()]*)\)$/.exec(part);
      if (!known || !match || relation || match[1] !== known.name ||
          (match[2] || match[1]) !== known.table) throw new Error('Unsupported relation selection');
      relation = { ...known, columns: match[3].split(',').map(x => x === '*' ? x : identifier(x)) };
    } else columns.push(part === '*' ? part : identifier(part));
  }
  if (!columns.length) throw new Error('Select at least one base column');
  return { columns, relation };
}

function normalize(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]));
  }
  return value;
}

class PostgresQuery {
  constructor(adapter, table) {
    if (!TABLES.has(table)) throw new Error('Unsupported database table');
    this.adapter = adapter;
    this.table = table;
    this.operation = 'read';
    this.filters = [];
    this.orders = [];
    this.selection = projection(table);
    this.returning = false;
  }

  select(columns = '*', options = {}) {
    this.selection = projection(this.table, columns);
    if (options.count && options.count !== 'exact') throw new Error('Only exact count is supported');
    this.count = options.count === 'exact';
    this.head = options.head === true;
    this.returning = true;
    return this;
  }
  insert(data) { return this.mutation('insert', data); }
  update(data) { return this.mutation('update', data); }
  delete() { this.operation = 'delete'; return this; }
  upsert(data) {
    if (!CONFLICT_KEYS[this.table]) throw new Error('No supported conflict key for this table');
    return this.mutation('upsert', data);
  }
  mutation(operation, data) {
    const rows = Array.isArray(data) ? data : [data];
    if (!rows.length || rows.some(row => !row || Object.getPrototypeOf(row) !== Object.prototype || !Object.keys(row).length)) {
      throw new Error('Mutation requires nonempty records');
    }
    if (operation === 'update' && Array.isArray(data)) throw new Error('Update requires one record');
    rows.forEach(row => Object.keys(row).forEach(identifier));
    this.operation = operation;
    this.payload = rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => {
      const jsonColumn = (this.table === 'evolution_games' && key === 'config') ||
        (this.table === 'evolution_game_replays' && key === 'events');
      return [key, jsonColumn && value !== null ? JSON.stringify(value) : value];
    })));
    return this;
  }
  eq(column, value) { return this.filter(column, '=', value); }
  gt(column, value) { return this.filter(column, '>', value); }
  filter(column, operator, value) {
    if (value === undefined || value === null) throw new Error('Comparison requires a non-null value');
    this.filters.push({ type: 'compare', column: identifier(column), operator, value });
    return this;
  }
  in(column, values) {
    if (!Array.isArray(values)) throw new Error('IN filter requires an array');
    this.filters.push({ type: 'in', column: identifier(column), values: [...values] }); return this;
  }
  not(column, operator, value) {
    identifier(column);
    if (operator === 'is' && value === null) this.filters.push({ type: 'notNull', column });
    else if (operator === 'in' && typeof value === 'string' && /^\([^()]*\)$/.test(value)) {
      const values = value.slice(1, -1).split(',').filter(Boolean);
      this.filters.push({ type: 'notIn', column, values });
    } else throw new Error('Unsupported negated filter');
    return this;
  }
  or(expression) { this.filters.push({ type: 'or', groups: orFilters(expression) }); return this; }
  ilike(column, value) {
    if (typeof value !== 'string') throw new Error('ILIKE requires a string');
    this.filters.push({ type: 'ilike', column: identifier(column), value }); return this;
  }
  order(column, { ascending = true } = {}) {
    this.orders.push({ column: identifier(column), direction: ascending ? 'asc' : 'desc' }); return this;
  }
  limit(value) {
    if (!Number.isInteger(value) || value < 0 || value > 1000) throw new Error('Limit must be 0–1000');
    this.rowLimit = value; return this;
  }
  single() { this.cardinality = 'one'; return this; }
  maybeSingle() { this.cardinality = 'optional'; return this; }

  build({ count = false } = {}) {
    const query = this.adapter.knex(this.table).withSchema(this.adapter.schema);
    for (const f of this.filters) {
      if (f.type === 'compare') query.where(f.column, f.operator, f.value);
      else if (f.type === 'in') query.whereIn(f.column, f.values);
      else if (f.type === 'notIn') query.whereNotIn(f.column, f.values);
      else if (f.type === 'notNull') query.whereNotNull(f.column);
      else if (f.type === 'ilike') query.whereILike(f.column, f.value);
      else if (f.type === 'or') query.where(function () {
        for (const group of f.groups) this.orWhere(function () {
          for (const term of group) this.where(term.column, '=', term.value);
        });
      });
    }
    if (count) return query.count({ count: '*' });
    const { columns, relation } = this.selection;
    if (this.operation === 'read') {
      const selected = [...columns];
      if (relation && !selected.includes('*') && !selected.includes(relation.foreignKey)) selected.push(relation.foreignKey);
      query.select(selected);
    } else {
      if (relation) throw new Error('Mutation relation selection is unsupported');
      if (['update', 'delete'].includes(this.operation) && !this.filters.length) {
        throw new Error('Unfiltered mutations are not supported');
      }
      if (this.operation === 'delete') query.delete();
      else if (this.operation === 'update') query.update(this.payload[0]);
      else {
        query.insert(this.payload);
        if (this.operation === 'upsert') query.onConflict(CONFLICT_KEYS[this.table]).merge();
      }
      if (this.returning) query.returning(columns);
    }
    if (this.operation === 'read') {
      this.orders.forEach(order => query.orderBy(order.column, order.direction));
      if (this.rowLimit !== undefined) query.limit(this.rowLimit);
    }
    return query;
  }

  async execute() {
    try {
      if ((this.count || this.head) && this.operation !== 'read') throw new Error('Mutation counting unsupported');
      let count = null;
      if (this.count) count = Number((await this.adapter.run(this.build({ count: true })))[0].count);
      if (this.head) return { data: null, error: null, count };
      let rows = await this.adapter.run(this.build());
      if (this.operation !== 'read' && !this.returning) return { data: null, error: null, count };
      const { columns, relation } = this.selection;
      if (relation && rows.length) {
        const ids = [...new Set(rows.map(row => row[relation.foreignKey]).filter(id => id != null))];
        const related = ids.length ? await this.adapter.run(
          this.adapter.knex(relation.table).withSchema(this.adapter.schema)
            .select([...new Set([...relation.columns, 'id'])]).whereIn('id', ids)
        ) : [];
        const byId = new Map(related.map(row => [String(row.id), row]));
        rows = rows.map(row => {
          const linked = byId.get(String(row[relation.foreignKey]));
          const nested = linked ? { ...linked } : null;
          if (nested && !relation.columns.includes('*') && !relation.columns.includes('id')) delete nested.id;
          const result = { ...row, [relation.name]: nested };
          if (!columns.includes('*') && !columns.includes(relation.foreignKey)) delete result[relation.foreignKey];
          return result;
        });
      }
      if (this.cardinality && (rows.length > 1 || (this.cardinality === 'one' && rows.length !== 1))) {
        return { data: null, error: { code: 'PGRST116', message: 'Unexpected result cardinality' }, count };
      }
      return { data: normalize(this.cardinality ? rows[0] || null : rows), error: null, count };
    } catch (error) {
      // Knex errors can contain interpolated queries/values. Never forward them.
      return { data: null, error: { code: /^[0-9A-Z]{5}$/.test(error.code || '') ? error.code : 'DB_ERROR',
        message: 'Database operation failed' }, count: null };
    }
  }
  then(resolve, reject) {
    if (!this.promise) this.promise = this.execute();
    return this.promise.then(resolve, reject);
  }
}

function createPostgresAdapter(knex, { schema = 'herbalism', run = query => query } = {}) {
  identifier(schema);
  const adapter = { knex, schema, run, from: table => new PostgresQuery(adapter, table), close: () => knex.destroy() };
  return adapter;
}

module.exports = { createPostgresAdapter };
