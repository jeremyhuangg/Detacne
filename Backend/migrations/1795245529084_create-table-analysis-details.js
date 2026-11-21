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
    pgm.createTable('analysis_details', {
        result_id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
            references: 'analysis_results(id)',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        acne_id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
            references: 'acne_classify(id)',
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
    pgm.dropTable('analysis_details');
};
