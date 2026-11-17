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
    pgm.createTable('forgot_password', {
        user_id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
        },
        token: {
            type: 'CHAR(64)',
            notNull: true,
            unique: true,
        },
        created_at: {
            type: 'TIMESTAMP WITH TIME ZONE',
            notNull: true,
            default: pgm.func('NOW()'),
        },
        expired_at: {
            type: 'TIMESTAMP WITH TIME ZONE',
            notNull: true,
        },
        consumed_at: {
            type: 'TIMESTAMP WITH TIME ZONE',
            notNull: false,
            default: null,
        },
    });

    pgm.addConstraint('forgot_password', 'fk_forgot_password.user_id_users.id', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('forgot_password');
};
