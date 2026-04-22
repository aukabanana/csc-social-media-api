import express, { Request, Response } from "express";
import "dotenv/config";
import { json, z, ZodError } from "zod";
import morgan from "morgan";
import prisma from "./lib/prisma.js";
import { REPLCommand } from "node:repl";
import { is } from "zod/locales";

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

app.post('/posts', async (req: Request, res: Response) => {
  try {
    const { title, content, authorId, published } = postSchema.parse(req.body);
    const post = await prisma.post.create({
      data: {
        title, content, authorId,
        published: published ?? false
      }
    })

    res.status(201).json(post);
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError)
      return res.status(400).json(e.issues);

    res.status(500).json(e);
  }
});

app.get('/posts', async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      include: { author: true },
      take: 5, skip: 0
    });

    res.status(200).json(posts);
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError)
      return res.status(400).json(e.issues);

    res.status(500).json(e);
  }
});

app.get('/users/:id', async (req: Request, res: Response) => {
  const isSchema = z.string();
  const id = isSchema.parse(req.params.id);

  const data = await prisma.user.findUnique({
    where: { id },
    include: { posts: true }
  });

  res.status(200).json(data);
});

app.patch('/posts/:id/publish', async (req: Request, res: Response) => {
  try {
    const isSchema = z.string();
    const id = isSchema.parse(req.params.id);
    const updatePost = await prisma.post.update({
      where: { id },
      data: { published: true }
    });

    res.status(200).json(updatePost);
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError)
      return res.status(400).json(e.issues);

    res.status(500).json(e);
  }
});

app.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const isSchema = z.string();
    const id = isSchema.parse(req.params.id);
    const deleteUser = await prisma.user.delete({
      where: { id }
    })
    res.status(200).json(deleteUser);
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError)
      return res.status(400).json(e.issues);

    res.status(500).json(e);
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});