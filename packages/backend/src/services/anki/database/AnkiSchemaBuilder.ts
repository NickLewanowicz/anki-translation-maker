import sqlite3 from 'sqlite3'

export class AnkiSchemaBuilder {
    /**
     * Creates the complete Anki database schema with tables and indexes
     */
    createSchema(db: sqlite3.Database, callback: (err?: Error) => void): void {
        // Create tables first, then indexes
        const tableStatements = this.getTableStatements()
        const indexStatements = this.getIndexStatements()

        // First create all tables
        this.executeStatements(db, tableStatements, (tableErr) => {
            if (tableErr) {
                callback(tableErr)
                return
            }

            // Then create indexes
            this.executeStatements(db, indexStatements, callback)
        })
    }

    /**
     * Gets the SQL statements for creating all required tables
     */
    private getTableStatements(): string[] {
        return [
            // Collection table
            `CREATE TABLE col (
                id INTEGER PRIMARY KEY,
                crt INTEGER NOT NULL,
                mod INTEGER NOT NULL,
                scm INTEGER NOT NULL,
                ver INTEGER NOT NULL,
                dty INTEGER NOT NULL,
                usn INTEGER NOT NULL,
                ls INTEGER NOT NULL,
                conf TEXT NOT NULL,
                models TEXT NOT NULL,
                decks TEXT NOT NULL,
                dconf TEXT NOT NULL,
                tags TEXT NOT NULL
            )`,

            // Notes table
            `CREATE TABLE notes (
                id INTEGER PRIMARY KEY,
                guid TEXT NOT NULL,
                mid INTEGER NOT NULL,
                mod INTEGER NOT NULL,
                usn INTEGER NOT NULL,
                tags TEXT NOT NULL,
                flds TEXT NOT NULL,
                -- The use of type integer for sfld is deliberate, because it means that integer values in this
                -- field will sort numerically.
                sfld INTEGER NOT NULL,
                csum INTEGER NOT NULL,
                flags INTEGER NOT NULL,
                data TEXT NOT NULL
            )`,

            // Cards table
            `CREATE TABLE cards (
                id INTEGER PRIMARY KEY,
                nid INTEGER NOT NULL,
                did INTEGER NOT NULL,
                ord INTEGER NOT NULL,
                mod INTEGER NOT NULL,
                usn INTEGER NOT NULL,
                type INTEGER NOT NULL,
                queue INTEGER NOT NULL,
                due INTEGER NOT NULL,
                ivl INTEGER NOT NULL,
                factor INTEGER NOT NULL,
                reps INTEGER NOT NULL,
                lapses INTEGER NOT NULL,
                left INTEGER NOT NULL,
                odue INTEGER NOT NULL,
                odid INTEGER NOT NULL,
                flags INTEGER NOT NULL,
                data TEXT NOT NULL
            )`,

            // Review log table
            `CREATE TABLE revlog (
                id INTEGER PRIMARY KEY,
                cid INTEGER NOT NULL,
                usn INTEGER NOT NULL,
                ease INTEGER NOT NULL,
                ivl INTEGER NOT NULL,
                lastIvl INTEGER NOT NULL,
                factor INTEGER NOT NULL,
                time INTEGER NOT NULL,
                type INTEGER NOT NULL
            )`,

            // Graves table - for deleted items that need syncing
            `CREATE TABLE graves (
                usn INTEGER NOT NULL,
                oid INTEGER NOT NULL,
                type INTEGER NOT NULL
            )`
        ]
    }

    /**
     * Gets the SQL statements for creating all required indexes
     */
    private getIndexStatements(): string[] {
        return [
            `CREATE INDEX ix_notes_usn ON notes (usn)`,
            `CREATE INDEX ix_cards_usn ON cards (usn)`,
            `CREATE INDEX ix_revlog_usn ON revlog (usn)`,
            `CREATE INDEX ix_cards_nid ON cards (nid)`,
            `CREATE INDEX ix_cards_sched ON cards (did, queue, due)`,
            `CREATE INDEX ix_revlog_cid ON revlog (cid)`,
            `CREATE INDEX ix_notes_csum ON notes (csum)`
        ]
    }

    /**
     * Executes a series of SQL statements in sequence
     */
    private executeStatements(db: sqlite3.Database, statements: string[], callback: (err?: Error) => void): void {
        let completed = 0
        const total = statements.length

        if (total === 0) {
            callback()
            return
        }

        let hasError = false

        statements.forEach((stmt, index) => {
            if (hasError) return

            db.run(stmt, (err) => {
                if (hasError) return

                if (err) {
                    hasError = true
                    callback(new Error(`Failed to execute statement ${index + 1}: ${err.message}`))
                    return
                }

                completed++
                if (completed === total) {
                    callback()
                }
            })
        })
    }
} 