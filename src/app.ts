import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import connectDB from "./database/connect";
import indexRoutes from "./routes/index.route";
import { swaggersDocuments } from "./utils/swagger";
import swaggerUI from "swagger-ui-express";

dotenv.config();
const app = express();
const PORT: string | number = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(path.resolve(), "public")));
app.use("/attachment", express.static("public/attachment"));
app.use(cookieParser());

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`The app is running at : http://localhost:${PORT}`);
    });
    app.on("error", () => {
      console.log("Error while connecting");
    });
  })
  .catch(() => {
    console.log("Error while connecting");
  });
app.use(indexRoutes);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggersDocuments));
