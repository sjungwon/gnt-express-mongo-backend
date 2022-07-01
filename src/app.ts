import { Request, Response } from "express";

require("dotenv").config();

const express = require("express");

const app = express();
const port = process.env.PORT;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`hello world on port ${port}`);
});
