import express from "express";
const router = express.Router();
router.get("/", (req, res) => {
    res.send("mongo server hi");
});
export default router;
