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
    pgm.createTable('acne_solutions_relational', {
        acne_id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
            references: 'acne_classify(id)',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        solution_id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
            references: 'acne_solutions(id)',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('acne_solutions_relational');
};
