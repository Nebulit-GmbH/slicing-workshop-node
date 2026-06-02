"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emmett_1 = require("@event-driven-io/emmett");
const CreateCatalogEntryCommand_1 = require("./CreateCatalogEntryCommand");
const node_test_1 = require("node:test");
(0, node_test_1.describe)('CreateCatalogEntry Specification', () => {
    const given = emmett_1.DeciderSpecification.for({
        decide: CreateCatalogEntryCommand_1.decide,
        evolve: CreateCatalogEntryCommand_1.evolve,
        initialState: CreateCatalogEntryCommand_1.CreateCatalogEntryInitialState,
    });
    (0, node_test_1.it)('creates a catalogue entry on empty stream', () => {
        const command = {
            type: 'CreateCatalogEntry',
            data: {
                id: 'test-id',
                title: 'Test Book',
                isbn: '978-0-123456-47-2',
                author: 'Test Author',
                description: 'A test book description',
            },
            metadata: {},
        };
        given([])
            .when(command)
            .then([{
                type: 'CatalogueEntryCreated',
                data: {
                    id: 'test-id',
                    title: 'Test Book',
                    isbn: '978-0-123456-47-2',
                    author: 'Test Author',
                    description: 'A test book description',
                },
                metadata: {},
            }]);
    });
    (0, node_test_1.it)('throws when catalog entry already exists', () => {
        const command = {
            type: 'CreateCatalogEntry',
            data: {
                id: 'test-id',
                title: 'Test Book',
                isbn: '978-0-123456-47-2',
                author: 'Test Author',
                description: 'A test book description',
            },
            metadata: {},
        };
        given([{
                type: 'CatalogueEntryCreated',
                data: {
                    id: 'test-id',
                    title: 'Test Book',
                    isbn: '978-0-123456-47-2',
                    author: 'Test Author',
                    description: 'A test book description',
                },
                metadata: {},
            }])
            .when(command)
            .thenThrows();
    });
});
