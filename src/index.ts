import express, { Request, Response } from "express";
import "dotenv/config";
import { z, ZodError } from "zod";
import morgan from "morgan";
import prisma from "./lib/prisma.js";
import { REPLCommand } from "node:repl";

const app = express();
const PORT = process.env.PORT;

if (!PORT) throw new Error('PORT is missing in your env file');

app.use(express.json());
app.use(morgan("dev"));

const userSchema = z.object({
  username: z.string(),
  email: z.email(),
});

const postSchema = z.object({
  title: z.string(),
  content: z.string(),
  published: z.boolean().default(false),
  authorId: z.string(),
});

app.get("/", (_req, res: Response) => {
  res.send("Hello World");
});

app.post('/users', async (req: Request, res: Response) => {
  try {
    const { username, email } = userSchema.parse(req.body);
    const user = await prisma.user.create({
      data: { username, email }
    });

    res.status(201).json(user);
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError)
      return res.status(400).json(e.issues);

    res.status(500).json(e);
  }
});

app.get('/users', async (req: Request, res: Response) => {
  const data = await prisma.user.findMany();
  res.status(200).json(data);
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});