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
// root router
app.get("/test", (req, res, next) => {
    res.send("Hello World!");
});
const port = 5000;
///
const Schema = mongoose_1.default.Schema;
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
const UserModel = mongoose_1.default.model("User", User);
//
// database connect
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect("mongodb://127.0.0.1:27017/giftMatcher");
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
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("params", req.body);
        const { email, username } = req.body;
        const color = generateRandomColor();
        const user = new UserModel({ username, email, color });
        yield user.save();
        res.json({
            status: "success",
            user,
        });
    }
    catch (err) {
        console.log("register err: ", err);
    }
    finally {
        res.end();
    }
}));
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, username } = req.body;
        const user = yield UserModel.findOne({ email, username });
        res.json({
            status: "success",
            user,
        });
    }
    catch (err) {
        console.log("login err: ", err);
    }
    finally {
        res.end();
    }
}));
app.get("/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        console.log("email", email);
        const excludedUser = yield UserModel.findOne({ email });
        if (!excludedUser) {
            res.json({
                status: "error",
                message: "Your email is not among the requested emails",
            });
            res.end();
        }
        if (excludedUser === null || excludedUser === void 0 ? void 0 : excludedUser.receiverEmail) {
            res.json({
                status: "error",
                message: "You have already chosen a color. No round two for you",
            });
            res.end();
        }
        console.log("excludedUser", excludedUser);
        const users = yield UserModel.find({ _id: { $ne: excludedUser.id } }, { _id: 1, isFree: 1 });
        res.json({
            users,
        });
    }
    catch (err) {
        console.log("get all err:", err);
    }
    finally {
        res.end();
    }
}));
app.get("/user/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        console.log("email", email);
        const user = yield UserModel.findOne({ email }, { _id: 1 });
        res.json({
            user,
        });
    }
    catch (err) {
        console.log("get user err:", err);
    }
}));
app.put("/:giverId/:receiverId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _id = `${req.params.receiverId}`;
        const giverId = `${req.params.giverId}`;
        console.log("_id, giverId", _id, giverId);
        const giver = yield UserModel.findById(giverId);
        const receiver = yield UserModel.findById(_id);
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
        yield UserModel.updateOne({ _id: giver._id }, { receiverEmail: receiver.email, receiverUsername: receiver.username });
        yield UserModel.updateOne({ _id: receiver._id }, { isFree: false });
        res.json({
            data: {
                giverId: giver.id,
                receiverId: receiver._id,
            },
        });
    }
    catch (err) {
        console.log("get all err:", err);
    }
    finally {
        res.end();
    }
}));
exports.default = app;
//# sourceMappingURL=app.js.map