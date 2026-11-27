/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable('articles', {
        id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
        },
        judul: {
            type: 'TEXT',
            notNull: true,
        },
        kategori: {
            type: 'TEXT',
            notNull: true,
        },
        ringkasan: {
            type: 'TEXT',
            notNull: true,
        },
        isi: {
            type: 'TEXT',
            notNull: true,
        },
        foto: {
            type: 'TEXT',
        },
        status_terbit: {
            type: 'BOOLEAN',
            notNull: true,
        },
        status_top: {
            type: 'BOOLEAN',
            notNull: true,
        },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('articles');
};
