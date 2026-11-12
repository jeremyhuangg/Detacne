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
    pgm.createTable('users', {
        id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
        },
        nickname: {
            type: 'VARCHAR(250)',
            notNull: true,
        },
        email: {
            type: 'VARCHAR(254)',
            unique: true,
            notNull: true,
        },
        password: {
            type: 'TEXT',
            notNull: true,
        },
        gender: {
            type: 'VARCHAR(10)',
            notNull: true,
        },
        date_of_birth: {
            type: 'DATE',
            notNull: true,
        },
        is_verified: {
            type: 'BOOLEAN',
            notNull: true,
            default: false,
        },
        role: {
            type: 'VARCHAR(20)',
            notNull: true,
            default: 'user',
        },
    });

    pgm.addConstraint('users', 'users_gender_check', {
        check: "gender IN ('male', 'female')",
    });

    pgm.addConstraint('users', 'users_role_check', {
        check: "role IN ('user', 'admin')",
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('users');
};
