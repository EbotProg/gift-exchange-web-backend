import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { ErrorRequestHandler } from "express";

type AcceptedEmail = "achaleebotoma2002@gmail.com" | "achaleebot9@gmail.com";

function generateRandomColor(): string {
  const hexValues = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ];
  let color = "#";

  for (let i = 0; i < 6; i++) {
    color += hexValues[Math.floor(Math.random() * 16)];
  }

  return color;
}

const app: Application = express();

// using cors middleware
app.use(cors());

// data parse
app.use(express.json()); // receive json data
app.use(express.urlencoded({ extended: true })); // url anchor data

// root router
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hello World!");
});

const port: number = 5000;

///
const Schema = mongoose.Schema;

const User = new Schema({
  email: {
    type: String,
    enum: ["achaleebotoma2002@gmail.com", "achaleebot9@gmail.com"],
    unique: [true, "Someone is already using this email"],
    required: [true, "You must enter your email"],
  },
  username: {
    type: String,
    unique: [true, "Someone already has this username"],
  },
  color: String,
  receiverUsername: String,
  receiverEmail: String,
  isFree: Boolean,
});

// Compile model from schema
const UserModel = mongoose.model("User", User);
//

const uri = 'mongodb+srv://EbotProg:Jesus123@cluster0.sszjs9x.mongodb.net/giftMatcher'
// database connect
async function main() {
  try {
    await mongoose.connect(
      // "mongodb://127.0.0.1:27017/giftMatcher",
      uri
    );
    console.log("database connection successfully");
    app.listen(port, () => {
      console.log(`server listening on port ${port}`);
    });
  } catch (error: any) {
    console.log(`failed to connect database ${error}`);
  }
}
// call a database
main();

app.post("/register", async (req: Request, res: Response) => {
  try {
    console.log("params", req.body);
    const { email, username } = req.body;
    const color = generateRandomColor();
    const user = new UserModel({ username, email, color });

    await user.save();
    res.json({
      status: "success",
      user,
    });
  } catch (err: any) {
    console.log("register err: ", err);
  } finally {
    res.end();
  }
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, username } = req.body;
    const user = await UserModel.findOne({ email, username });

    res.json({
      status: "success",
      user,
    });
  } catch (err: any) {
    console.log("login err: ", err);
  } finally {
    res.end();
  }
});

app.get("/:email", async (req: Request, res: Response) => {
  try {
    const email = req.params.email;
    console.log("email", email);
    const excludedUser = await UserModel.findOne({ email });

    if (!excludedUser) {
      res.json({
        status: "error",
        message: "Your email is not among the requested emails",
      });
      res.end();
    }

    if (excludedUser?.receiverEmail) {
      res.json({
        status: "error",
        message: "You have already chosen a color. No round two for you",
      });
      res.end();
    }

    console.log("excludedUser", excludedUser);

    const users = await UserModel.find(
      { _id: { $ne: excludedUser.id } },
      { _id: 1, isFree: 1 },
    );
    res.json({
      users,
    });
  } catch (err: any) {
    console.log("get all err:", err);
  } finally {
    res.end();
  }
});

app.get("/user/:email", async (req: Request, res: Response) => {
  try {
    const email = req.params.email;
    console.log("email", email);
    const user = await UserModel.findOne({ email }, { _id: 1 });
    res.json({
      user,
    });
  } catch (err: any) {
    console.log("get user err:", err);
  }
});

app.put("/:giverId/:receiverId", async (req: Request, res: Response) => {
  try {
    const _id = `${req.params.receiverId}`;
    const giverId = `${req.params.giverId}`;
    console.log("_id, giverId", _id, giverId);
    const giver = await UserModel.findById(giverId);
    const receiver = await UserModel.findById(_id);

    if (!giver) {
      res.status(400).json({
        status: "error",
        message: "giver not found",
      });
      res.end();
    }

    if (giver.receiverEmail) {
      res.status(400).json({
        status: "error",
        message: "user already has a receiver",
      });
      res.end();
    }

    if (!receiver) {
      res.status(400).json({
        status: "error",
        message: "receiver not found",
      });
      res.end();
    }

    await UserModel.updateOne(
      { _id: giver._id },
      { receiverEmail: receiver.email, receiverUsername: receiver.username },
    );
    await UserModel.updateOne({ _id: receiver._id }, { isFree: false });

    res.json({
      data: {
        giverId: giver.id,
        receiverId: receiver._id,
      },
    });
  } catch (err: any) {
    console.log("get all err:", err);
  } finally {
    res.end();
  }
});

export default app;
