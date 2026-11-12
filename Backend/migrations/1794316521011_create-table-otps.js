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
    pgm.createTable('otps', {
        id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
        },
        user_id: {
            type: 'VARCHAR(50)',
            notNull: true,
        },
        otp : {
            type: 'TEXT',
            notNull: true,
        },
        created_at: {
            type: 'TIMESTAMP WITH TIME ZONE',
            notNull: true,
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

    pgm.addConstraint('otps', 'fk_otps.user_id_users.id', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE');
    pgm.addConstraint('otps', 'unique_user_id', 'UNIQUE(user_id)');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('otps');
};
