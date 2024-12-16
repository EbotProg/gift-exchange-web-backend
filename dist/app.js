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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const PDFDocument = require("pdfkit-table");
// const fs = require('fs');
// const path = require('path')
// const moment = require("moment")
const fs_1 = __importDefault(require("fs"));
const moment_1 = __importDefault(require("moment"));
function generateRandomColor() {
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
const app = (0, express_1.default)();
// using cors middleware
app.use((0, cors_1.default)());
// data parse
app.use(express_1.default.json()); // receive json data
app.use(express_1.default.urlencoded({ extended: true })); // url anchor data
const port = 5000;
///
const Schema = mongoose_1.default.Schema;
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
const UserModel = mongoose_1.default.model("User", User);
//
const uri = "mongodb+srv://EbotProg:Jesus123@cluster0.sszjs9x.mongodb.net/giftMatcher";
// const uriLocal = "mongodb://127.0.0.1:27017/giftMatcher";
// database connect
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(uri);
            console.log("database connection successfully");
            app.listen(port, () => {
                console.log(`server listening on port ${port}`);
            });
        }
        catch (error) {
            console.log(`failed to connect database ${error}`);
        }
    });
}
// call a database
main();
// root router
app.get("/test", (req, res, next) => {
    res.send("Hello World!");
});
app.get("/download", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield UserModel.find({}, { username: 1, receiverUsername: 1 });
        const headers = ["Giver", "Receiver"];
        const rows = [];
        for (let user of users) {
            rows.push([user.username, user.receiverUsername]);
        }
        yield generateReportPdf(headers, rows);
        //     const filePath = `${path.join(__dirname, `/../pdfs/${pdfName}.pdf`)}`
        //  console.log("filepath", filePath);
        //  setTimeout(()=> {
        res.download("./document.pdf", (err) => {
            if (err) {
                console.error(err);
                return res.send({ error: "Error downloading file" });
            }
            else {
                // return res.send({ message: "Pdf Downloaded"});
                console.log("pdf downloaded");
            }
        });
    }
    catch (err) {
        console.log("download err:", err);
        res.json({
            status: "error",
            message: "Internal server error",
        });
    }
}));
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
app.get("/user/:number", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const number = Number(req.params.number);
        console.log("number", number);
        const user = yield UserModel.findOne({ number }, { _id: 1 });
        res.json({
            user,
        });
    }
    catch (err) {
        console.log("get user err:", err);
        res.json({
            status: "error",
            message: "Internal server error",
        });
    }
}));
app.get("/getall/:number", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const number = Number(req.params.number);
        console.log("number", number);
        const excludedUser = yield UserModel.findOne({ number });
        if (!excludedUser) {
            res.json({
                status: "error",
                message: "Your number is not among the given numbers",
            });
            res.end();
            return;
        }
        if (excludedUser === null || excludedUser === void 0 ? void 0 : excludedUser.receiverNumber) {
            res.json({
                status: "error",
                message: "You have already chosen a color. You are not allowed to choose again",
            });
            res.end();
            return;
        }
        console.log("excludedUser", excludedUser);
        const users = yield UserModel.find({ _id: { $ne: excludedUser.id } }, { _id: 1, isFree: 1 });
        res.json({
            users,
        });
    }
    catch (err) {
        console.log("get all err:", err);
        res.json({
            status: "error",
            message: "Internal server error",
        });
    }
    finally {
        res.end();
    }
}));
app.put("/update/:giverId/:receiverId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _id = `${req.params.receiverId}`;
        const giverId = `${req.params.giverId}`;
        console.log("_id, giverId", _id, giverId);
        const giver = yield UserModel.findById(giverId);
        const receiver = yield UserModel.findById(_id);
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
        yield UserModel.updateOne({ _id: giver._id }, { receiverNumber: receiver.number, receiverUsername: receiver.username });
        yield UserModel.updateOne({ _id: receiver._id }, { isFree: false });
        res.json({
            data: {
                giverId: giver.id,
                receiverId: receiver._id,
            },
        });
    }
    catch (err) {
        console.log("update err:", err);
        res.json({
            status: "error",
            message: "Internal server error",
        });
    }
    finally {
        res.end();
    }
}));
function generateReportPdf(headers, rows) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let doc = new PDFDocument({ margin: 30, size: "A3" });
            return new Promise((resolve, reject) => {
                const { outline } = doc;
                const top = outline.addItem("Top Level", { expanded: true });
                top.addItem("Sub-section");
                // let date = new Date();
                // let val = moment(date).format("DD-MM-YYYY____HH:mm:ss")
                // const pdfName = `gift_exchange_list_${val}`;
                const writeStream = doc.pipe(fs_1.default.createWriteStream("./document.pdf"));
                // console.log("pdf will be saved at", `${path.join(__dirname, `/../dist/pdfs/${pdfName}.pdf`)}`)
                doc.fontSize(30);
                doc.fontSize(15);
                doc.moveDown();
                doc
                    .font("Helvetica")
                    .text(`Family Gift exchange list made on ${(0, moment_1.default)(new Date()).format("DD-MM-YYYY____HH:mm:ss")}`, {
                    align: "center",
                });
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
        }
        catch (err) {
            console.log(err);
        }
    });
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
exports.default = app;
//# sourceMappingURL=app.js.map