import express from "express";
import test from "./test";
import user from "./user";
import workspace from "./workspace";
import data from "./data";
import docker from "./docker";
import userList from "./userList";

const router = express.Router();

router.use("/", test);
router.use("/user", user);
router.use("/workspace", workspace);
router.use("/data", data);
router.use("/docker", docker);
router.use("/userList", userList);

export default router;
