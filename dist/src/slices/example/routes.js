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
const db_1 = require("../../common/db");
const assertions_1 = require("../../util/assertions");
const api = () => (router) => {
    /**
     * @openapi
     * /api/org/{orgId}/examples:
     *   get:
     *     summary: List all examples for an organization
     *     tags: [Example]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: List of examples
     *       401:
     *         description: Unauthorized
     */
    router.get('/api/org/:orgId/examples', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { orgId } = req.params;
        const db = (0, db_1.getKnexInstance)();
        const rows = yield db('examples').where({ organization_id: orgId }).select('*');
        res.status(200).json(rows);
    }));
    /**
     * @openapi
     * /api/org/{orgId}/examples:
     *   post:
     *     summary: Create a new example
     *     tags: [Example]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name:
     *                 type: string
     *     responses:
     *       201:
     *         description: Example created
     *       400:
     *         description: name is required
     *       401:
     *         description: Unauthorized
     */
    router.post('/api/org/:orgId/examples', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { orgId } = req.params;
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ error: 'name is required' });
            return;
        }
        const db = (0, db_1.getKnexInstance)();
        const [row] = yield db('examples')
            .insert({ organization_id: orgId, name, created_by: 'local-user' })
            .returning('*');
        res.status(201).json(row);
    }));
    /**
     * @openapi
     * /api/org/{orgId}/examples/{id}:
     *   delete:
     *     summary: Delete an example by id
     *     tags: [Example]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orgId
     *         required: true
     *         schema: { type: string }
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: Example deleted
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Not found
     */
    router.delete('/api/org/:orgId/examples/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const orgId = (0, assertions_1.assertNotEmpty)(req.params.orgId);
        const id = (0, assertions_1.assertNotEmpty)(req.params.id);
        const db = (0, db_1.getKnexInstance)();
        const deleted = yield db('examples')
            .where({ id, organization_id: orgId })
            .delete();
        if (!deleted) {
            res.status(404).json({ error: 'not found' });
            return;
        }
        res.status(200).json({ ok: true });
    }));
};
exports.api = api;
