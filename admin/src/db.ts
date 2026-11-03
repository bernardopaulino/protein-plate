export class WriteRefused extends Error {
  constructor() {
    super("read_only");
    this.name = "WriteRefused";
  }
}

/** Uma só instrução SELECT: sem ";" (nada de uma segunda instrução) e sem CTEs (WITH … DELETE). */
const SELECT_ONLY = /^\s*select\b[^;]*$/i;

/**
 * A D1 das páginas só lê: `prepare` aceita apenas um SELECT, e `exec` (várias instruções em
 * texto livre), `dump` e `withSession` não existem. O `batch` só recebe instruções que já
 * passaram pelo `prepare`. A mesma base serve a app, por isso isto é o que garante que as
 * páginas do backoffice nunca escrevem; as duas ações usam outra ligação (actions.ts).
 */
export function readOnlyD1(d1: D1Database): D1Database {
  return {
    prepare(query: string) {
      if (!SELECT_ONLY.test(query)) throw new WriteRefused();
      return d1.prepare(query);
    },
    batch(statements: D1PreparedStatement[]) {
      return d1.batch(statements);
    },
    exec() {
      throw new WriteRefused();
    },
    dump() {
      throw new WriteRefused();
    },
    withSession() {
      throw new WriteRefused();
    },
  } as unknown as D1Database;
}

/** Um valor que se pode ligar a uma consulta (os parâmetros nunca vão no texto do SQL). */
export type SqlValue = string | number | null;

/** Leituras por cima da D1 só de leitura: o SQL é sempre fixo e os valores vão por parâmetros. */
export interface AdminDb {
  all<T>(query: string, ...params: SqlValue[]): Promise<T[]>;
  first<T>(query: string, ...params: SqlValue[]): Promise<T | null>;
}

export function adminDb(d1: D1Database): AdminDb {
  const db = readOnlyD1(d1);
  return {
    async all<T>(query: string, ...params: SqlValue[]) {
      const { results } = await db
        .prepare(query)
        .bind(...params)
        .all<T>();
      return results;
    },
    first<T>(query: string, ...params: SqlValue[]) {
      return db
        .prepare(query)
        .bind(...params)
        .first<T>();
    },
  };
}

/** Um ID de conta ou de receita (letras, números, "-" e "_"): outro texto nem chega à base. */
const ID = /^[A-Za-z0-9_-]{1,64}$/;

export function isId(value: string): boolean {
  return ID.test(value);
}

/** Uma lista JSON de textos guardada numa coluna (as refeições, os alimentos, o equipamento). */
export function jsonStrings(text: string | null | undefined): string[] {
  if (!text) return [];
  try {
    const value: unknown = JSON.parse(text);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
