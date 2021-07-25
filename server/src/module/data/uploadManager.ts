import { DataDirectoryPath } from "../../types/module/data/data.types";
import { TUploadManager } from "../../types/module/data/file.types";
import { getJsonData, setJsonData } from "./fileManager";
import fs from "fs";

export default class DataUploadManager {
    static UploadFileManager: TUploadManager = {};
    static getUploadInfoPath(uploadFileInfo: "uploadFileInfo.json" | "" = "") {
        return `${DataDirectoryPath}/upload/${uploadFileInfo}`;
    }
    static saveUploadFileInfo() {
        setJsonData(this.getUploadInfoPath("uploadFileInfo.json"), this.UploadFileManager);
    }
    static loadUploadFileInfo() {
        if (!fs.existsSync(this.getUploadInfoPath("uploadFileInfo.json"))) {
            fs.mkdirSync(this.getUploadInfoPath(), { recursive: true });
            fs.openSync(this.getUploadInfoPath("uploadFileInfo.json"), "w");
            fs.writeFileSync(this.getUploadInfoPath("uploadFileInfo.json"), JSON.stringify({}));
        } else {
            this.UploadFileManager = getJsonData(this.getUploadInfoPath("uploadFileInfo.json"));
        }
    }
}
