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
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const db_1 = require("../../../common/db");
const CatalogEntriesProjection_1 = require("./CatalogEntriesProjection");
const api = () => (router) => {
    /**
     * @openapi
     * /api/catalog-entries:
     *   get:
     *     summary: List all catalog entries
     *     tags: [CatalogEntry]
     *     parameters:
     *       - in: query
     *         name: _id
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: List of catalog entries
     */
    router.get('/api/catalog-entries', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const id = (_a = req.query._id) === null || _a === void 0 ? void 0 : _a.toString();
            const db = (0, db_1.getKnexInstance)();
            const data = id
                ? yield db(CatalogEntriesProjection_1.tableName).withSchema('public').where({ id }).select('id', 'title')
                : yield db(CatalogEntriesProjection_1.tableName).withSchema('public').select('id', 'title');
            return res.status(200).json(data);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ ok: false, error: 'Server error' });
        }
    }));
};
exports.api = api;
