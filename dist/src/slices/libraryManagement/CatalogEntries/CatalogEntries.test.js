"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const emmett_postgresql_1 = require("@event-driven-io/emmett-postgresql");
const CatalogEntriesProjection_1 = require("./CatalogEntriesProjection");
const postgresql_1 = require("@testcontainers/postgresql");
const knex_1 = __importDefault(require("knex"));
const assert_1 = __importDefault(require("assert"));
const testHelpers_1 = require("../../../common/testHelpers");
const TEST_ID = 'test-catalog-001';
(0, node_test_1.describe)('CatalogEntries Specification', () => {
    let postgres;
    let connectionString;
    let db;
    let given;
    (0, node_test_1.before)(() => __awaiter(void 0, void 0, void 0, function* () {
        postgres = yield new postgresql_1.PostgreSqlContainer('postgres').start();
        connectionString = postgres.getConnectionUri();
        db = (0, knex_1.default)({ client: 'pg', connection: connectionString });
        yield (0, testHelpers_1.runFlywayMigrations)(connectionString);
        given = emmett_postgresql_1.PostgreSQLProjectionSpec.for({
            projection: CatalogEntriesProjection_1.CatalogEntriesProjection,
            connectionString,
        });
    }));
    (0, node_test_1.after)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (db === null || db === void 0 ? void 0 : db.destroy());
        yield (postgres === null || postgres === void 0 ? void 0 : postgres.stop());
    }));
    (0, node_test_1.it)('spec: CatalogEntries - inserts row on CatalogueEntryCreated', () => __awaiter(void 0, void 0, void 0, function* () {
        const assertReadModel = (_a) => __awaiter(void 0, [_a], void 0, function* ({ connectionString: connStr }) {
            const queryDb = (0, knex_1.default)({ client: 'pg', connection: connStr });
            try {
                const result = yield queryDb(CatalogEntriesProjection_1.tableName)
                    .withSchema('public')
                    .where({ id: TEST_ID })
                    .first();
                assert_1.default.ok(result, 'row should exist');
                assert_1.default.strictEqual(result.id, TEST_ID);
                assert_1.default.strictEqual(result.title, 'Clean Architecture');
            }
            finally {
                yield queryDb.destroy();
            }
        });
        yield given([{
                type: 'CatalogueEntryCreated',
                data: {
                    id: TEST_ID,
                    title: 'Clean Architecture',
                    isbn: '978-0-13-468599-1',
                    author: 'Robert C. Martin',
                    description: 'A craftsman\'s guide to software structure and design',
                },
                metadata: { stream_name: `LibraryManagement-${TEST_ID}` },
            }])
            .when([])
            .then(assertReadModel);
    }));
    (0, node_test_1.it)('spec: Catalog Entries - scenario: removes entry on CatalogueEntryRemoved', () => __awaiter(void 0, void 0, void 0, function* () {
        const REMOVE_ID = 'test-catalog-remove-001';
        const assertReadModel = (_a) => __awaiter(void 0, [_a], void 0, function* ({ connectionString: connStr }) {
            const queryDb = (0, knex_1.default)({ client: 'pg', connection: connStr });
            try {
                const rows = yield queryDb(CatalogEntriesProjection_1.tableName)
                    .withSchema('public')
                    .where({ id: REMOVE_ID })
                    .select('*');
                assert_1.default.strictEqual(rows.length, 0, 'row should be removed');
            }
            finally {
                yield queryDb.destroy();
            }
        });
        yield given([
            {
                type: 'CatalogueEntryCreated',
                data: { id: REMOVE_ID, title: 'To Be Removed', isbn: '999', author: 'Author', description: 'Desc' },
                metadata: { stream_name: `LibraryManagement-${REMOVE_ID}` },
            },
            {
                type: 'CatalogueEntryRemoved',
                data: { id: REMOVE_ID },
                metadata: { stream_name: `LibraryManagement-${REMOVE_ID}` },
            },
        ])
            .when([])
            .then(assertReadModel);
    }));
    (0, node_test_1.it)('spec: CatalogEntries - upserts on duplicate CatalogueEntryCreated', () => __awaiter(void 0, void 0, void 0, function* () {
        const UPSERT_ID = 'test-catalog-002';
        const assertReadModel = (_a) => __awaiter(void 0, [_a], void 0, function* ({ connectionString: connStr }) {
            const queryDb = (0, knex_1.default)({ client: 'pg', connection: connStr });
            try {
                const rows = yield queryDb(CatalogEntriesProjection_1.tableName)
                    .withSchema('public')
                    .where({ id: UPSERT_ID })
                    .select('*');
                assert_1.default.strictEqual(rows.length, 1, 'should have exactly one row after upsert');
                assert_1.default.strictEqual(rows[0].title, 'Updated Title');
            }
            finally {
                yield queryDb.destroy();
            }
        });
        yield given([
            {
                type: 'CatalogueEntryCreated',
                data: { id: UPSERT_ID, title: 'Original Title', isbn: '111', author: 'Author', description: 'Desc' },
                metadata: { stream_name: `LibraryManagement-${UPSERT_ID}` },
            },
            {
                type: 'CatalogueEntryCreated',
                data: { id: UPSERT_ID, title: 'Updated Title', isbn: '111', author: 'Author', description: 'Desc' },
                metadata: { stream_name: `LibraryManagement-${UPSERT_ID}` },
            },
        ])
            .when([])
            .then(assertReadModel);
    }));
});
