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
exports.CatalogEntriesProjection = exports.tableName = void 0;
const emmett_postgresql_1 = require("@event-driven-io/emmett-postgresql");
const dumbo_1 = require("@event-driven-io/dumbo");
const knex_1 = __importDefault(require("knex"));
exports.tableName = 'catalog_entries';
const getKnexInstance = (connectionString) => (0, knex_1.default)({ client: 'pg', connection: connectionString, pool: { min: 0, max: 1 } });
exports.CatalogEntriesProjection = (0, emmett_postgresql_1.postgreSQLRawSQLProjection)({
    name: 'CatalogEntriesProjection',
    canHandle: ['CatalogueEntryCreated', 'CatalogueEntryRemoved'],
    evolve: (event, context) => __awaiter(void 0, void 0, void 0, function* () {
        const db = getKnexInstance(context.connection.connectionString);
        try {
            switch (event.type) {
                case 'CatalogueEntryCreated':
                    return [(0, dumbo_1.sql)(db(exports.tableName)
                            .withSchema('public')
                            .insert({
                            id: event.data.id,
                            title: event.data.title,
                        })
                            .onConflict('id')
                            .merge(['title'])
                            .toQuery())];
                case 'CatalogueEntryRemoved':
                    return [(0, dumbo_1.sql)(db(exports.tableName)
                            .withSchema('public')
                            .where({ id: event.data.id })
                            .delete()
                            .toQuery())];
                default:
                    return [];
            }
        }
        finally {
            yield db.destroy();
        }
    }),
});
