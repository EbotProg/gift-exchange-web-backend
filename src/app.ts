import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { ErrorRequestHandler } from "express";
const PDFDocument = require("pdfkit-table");
// const fs = require('fs');
// const path = require('path')
// const moment = require("moment")
import fs from "fs";
import path from "path";
import moment from "moment";
// const { PDFDocument } = require("pdfkit-table-ts")

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

const port: number = 5000;

///
const Schema = mongoose.Schema;

const User = new Schema({
  number: Number,
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
  receiverNumber: Number,
  isFree: Boolean,
});

// Compile model from schema
const UserModel = mongoose.model("User", User);
//

const uri = "mongodb+srv://EbotProg:Jesus123@cluster0.sszjs9x.mongodb.net/giftMatcher";
// const uriLocal = "mongodb://127.0.0.1:27017/giftMatcher";
// database connect
async function main() {
  try {
    await mongoose.connect(uri);
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

// root router
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hello World!");
});

app.get("/download", async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find(
      {},
      { username: 1, receiverUsername: 1 },
    );
    const headers: string[] = ["Giver", "Receiver"];

    const rows: string[][] = [];
    for (let user of users) {
      rows.push([user.username, user.receiverUsername]);
    }

    await generateReportPdf(headers, rows);

    //     const filePath = `${path.join(__dirname, `/../pdfs/${pdfName}.pdf`)}`
    //  console.log("filepath", filePath);
    //  setTimeout(()=> {
    res.download("./document.pdf", (err) => {
      if (err) {
        console.error(err);
        return res.send({ error: "Error downloading file" });
      } else {
        // return res.send({ message: "Pdf Downloaded"});
        console.log("pdf downloaded");
      }
    });
  } catch (err: any) {
    console.log("download err:", err);
    res.json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// app.get('/download', async (req: Request, res: Response) => {
//   try {
//     const users = await UserModel.find({}, { username: 1, receiverUsername: 1 });
//     const headers: string[] = ['Giver', 'Receiver'];
//     const rows: string[][] = users.map(user => [user.username, user.receiverUsername]);

//     const pdfName = await generateReportPdf(headers, rows);
//     const filePath = path.join(__dirname, `/../pdfs/${pdfName}.pdf`);

//     console.log('File path:', filePath);

//     res.download(filePath, (err) => {
//       if (err) {
//         console.error('Error downloading file:', err);
//         res.status(500).send({ error: 'Error downloading file' });
//       } else {
//         console.log('PDF downloaded successfully');
//       }
//     });
//   } catch (err) {
//     console.error('Download error:', err);
//     res.status(500).json({ status: 'error', message: 'Internal server error' });
//   }
// });

app.get("/user/:number", async (req: Request, res: Response) => {
  try {
    const number = Number(req.params.number);
    console.log("number", number);
    const user = await UserModel.findOne({ number }, { _id: 1 });
    res.json({
      user,
    });
  } catch (err: any) {
    console.log("get user err:", err);
    res.json({
      status: "error",
      message: "Internal server error",
    });
  }
});

app.get("/getall/:number", async (req: Request, res: Response) => {
  try {
    const number = Number(req.params.number);
    console.log("number", number);
    const excludedUser = await UserModel.findOne({ number });

    if (!excludedUser) {
      res.json({
        status: "error",
        message: "Your number is not among the given numbers",
      });
      res.end();
      return;
    }

    if (excludedUser?.receiverNumber) {
      res.json({
        status: "error",
        message:
          "You have already chosen a color. You are not allowed to choose again",
      });
      res.end();
      return;
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
    res.json({
      status: "error",
      message: "Internal server error",
    });
  } finally {
    res.end();
  }
});

app.put("/update/:giverId/:receiverId", async (req: Request, res: Response) => {
  try {
    const _id = `${req.params.receiverId}`;
    const giverId = `${req.params.giverId}`;
    console.log("_id, giverId", _id, giverId);
    const giver = await UserModel.findById(giverId);
    const receiver = await UserModel.findById(_id);

    if (!giver) {
      res.json({
        status: "error",
        message: "giver not found",
      });
      res.end();
      return;
    }

    if (giver.receiverNumber) {
      res.json({
        status: "error",
        message: "user already has a receiver",
      });
      res.end();
      return;
    }

    if (!receiver) {
      res.json({
        status: "error",
        message: "receiver not found",
      });
      res.end();
      return;
    }

    await UserModel.updateOne(
      { _id: giver._id },
      { receiverNumber: receiver.number, receiverUsername: receiver.username },
    );
    await UserModel.updateOne({ _id: receiver._id }, { isFree: false });

    res.json({
      data: {
        giverId: giver.id,
        receiverId: receiver._id,
      },
    });
  } catch (err: any) {
    console.log("update err:", err);
    res.json({
      status: "error",
      message: "Internal server error",
    });
  } finally {
    res.end();
  }
});

async function generateReportPdf(
  headers: string[],
  rows: string[][],
): Promise<void> {
  try {
    let doc = new PDFDocument({ margin: 30, size: "A3" });

    return new Promise((resolve, reject) => {
      const { outline } = doc;

      const top = outline.addItem("Top Level", { expanded: true });

      top.addItem("Sub-section");

      // let date = new Date();
      // let val = moment(date).format("DD-MM-YYYY____HH:mm:ss")
      // const pdfName = `gift_exchange_list_${val}`;

      const writeStream = doc.pipe(fs.createWriteStream("./document.pdf"));
      // console.log("pdf will be saved at", `${path.join(__dirname, `/../dist/pdfs/${pdfName}.pdf`)}`)

      doc.fontSize(30);

      doc.fontSize(15);
      doc.moveDown();
      doc
        .font("Helvetica")
        .text(
          `Family Gift exchange list made on ${moment(new Date()).format("DD-MM-YYYY____HH:mm:ss")}`,
          {
            align: "center",
          },
        );

      const table = {
        title: { label: "" },
        subtitle: { label: "" },
        headers: headers,
        rows: rows,
      };

      doc.table(table, {
        columnSpacing: 10,
        padding: 10,
        columnSize: [100, 100],
        //width: 800,
        align: "center",
        prepareHeader: () => doc.fontSize(10),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          const { x, y, width, height } = rectCell;

          if (indexColumn === 0) {
            doc
              .lineWidth(-5)
              .moveTo(x, y)
              .lineTo(x, y + height)
              .stroke("#999999");
          }

          doc
            .lineWidth(-5)
            .moveTo(x + width, y)
            .lineTo(x + width, y + height)
            .stroke("#999999");

          doc.fontSize(10).fillColor("#292929");
        },
      });

      doc.end();

      writeStream.on("finish", () => {
        // console.log("i don mbole: pdfName", pdfName)
        resolve();
      });
      writeStream.on("error", reject);
    });
  } catch (err) {
    console.log(err);
  }
}

// async function generateReportPdf(headers: string[], rows: string[][]) {
//   try {
//     const doc = new PDFDocument({
//       margin: 30,
//     });

//     ;(async function(){

//       let date = new Date();
//       let val = moment(date).format("DD-MM-YYYY____HH:mm:ss")
//       const pdfName = `gift_exchange_list_${val}`;

//       doc.pipe(fs.createWriteStream(`${path.join(__dirname, `/../pdfs/${pdfName}.pdf`)}`));

//       // -----------------------------------------------------------------------------------------------------
//       // Simple Table with Array
//       // -----------------------------------------------------------------------------------------------------
//       const table = {
//         headers: ["Country Country Country", "Conversion rate", "Trend"],
//         rows: [
//           ["Switzerland", "12%", "+1.12%"],
//           ["France", "67%", "-0.98%"],
//           ["England", "33%", "+4.44%"],
//         ],
//       };

//       const options = {
//         width: 300,
//         x: 150,
//         y: 100,
//         padding: {
//           top: 1, bottom: 1, left: 5, right: 5,
//         },
//       };

//       await doc.table(table, options);
//       doc.end();

//     })();
//   } catch (err) {
//     console.error('Error generating PDF:', err);
//     throw err;
//   }
// }

export default app;
