import { DataDirectoryPath } from "../../types/module/data/data.types";
import { TkanbanCreateData, TkanbanData } from "../../types/module/data/kanban.types";
import { getJsonData, isExists, setJsonData } from "./fileManager";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import log from "../log";
import DataWorkspaceManager from "./workspaceManager";
import DataAlarmManager from "./alarmManager";

export default class DataKanbanManager {
    static isExists(kanbanUUID: string) {
        return isExists(this.getKanbanPath(kanbanUUID));
    }

    static getKanbanPath(kanbanUUID?: string, type: "kanbanInfo.json" | "" = "") {
        const kanbanPath = kanbanUUID ? `${DataDirectoryPath}/issues/${kanbanUUID}` : `${DataDirectoryPath}/issues`;
        return type !== "" ? `${kanbanPath}/${type}` : kanbanPath;
    }

    static getKanbanInfo(kanbanUUID: string) {
        if (!this.isExists(kanbanUUID)) {
            return undefined;
        }
        return getJsonData(this.getKanbanPath(kanbanUUID, "kanbanInfo.json")) as TkanbanData;
    }

    static setKanbanInfo(kanbanUUID: string, kanbanData: TkanbanData) {
        if (!this.isExists(kanbanUUID)) {
            return false;
        }

        return setJsonData(this.getKanbanPath(kanbanUUID, "kanbanInfo.json"), kanbanData);
    }

    static updateIssueCount(kanbanUUID: string, type: "totalIssue" | "doneIssue", incOrDec: "increase" | "decrease") {
        const kanbanData = this.getKanbanInfo(kanbanUUID) as TkanbanData;

        if (type == "totalIssue") {
            if (incOrDec == "increase") {
                this.update(kanbanUUID, {
                    totalIssue: (kanbanData.totalIssue as number) + 1,
                });
            }
            if (incOrDec == "decrease") {
                this.update(kanbanUUID, {
                    totalIssue: (kanbanData.totalIssue as number) - 1,
                });
            }
        }
        if (type == "doneIssue") {
            if (incOrDec == "increase") {
                this.update(kanbanUUID, {
                    doneIssue: (kanbanData.doneIssue as number) + 1,
                });
            }
            if (incOrDec == "decrease") {
                this.update(kanbanUUID, {
                    doneIssue: (kanbanData.doneIssue as number) - 1,
                });
            }
        }
    }

    static increase() {}

    static get(options: Partial<TkanbanData>) {
        if (!fs.existsSync(this.getKanbanPath())) {
            fs.mkdirSync(this.getKanbanPath(), { recursive: true });
        }

        return fs
            .readdirSync(this.getKanbanPath())
            .filter((kanban) => {
                const kanbanData = kanban !== "milestoneListInfo.json" ? this.getKanbanInfo(kanban) : undefined;
                return (
                    kanban !== "milestoneListInfo.json" &&
                    (options.uuid === undefined || options.uuid === kanbanData?.uuid) &&
                    (options.column === undefined || (options.column as string) in (kanbanData?.columns as string[])) &&
                    (options.workspaceName === undefined || options.workspaceName === kanbanData?.workspaceName)
                );
            })
            .reduce((kanbanList: TkanbanData[], kanban: string) => {
                kanbanList.push(this.getKanbanInfo(kanban) as TkanbanData);
                return kanbanList;
            }, []);
    }

    static create(userId: string, kanbanData: TkanbanCreateData) {
        const kanbanUUID = uuidv4();
        fs.mkdirSync(this.getKanbanPath(kanbanUUID), { recursive: true });

        if (
            !fs
                .readdirSync(DataWorkspaceManager.getWorkspaceDefaultPath())
                .reduce((workspaceIdList: string[], workspaceId: string) => {
                    workspaceIdList.push(DataWorkspaceManager.getWorkspaceInfo(workspaceId)?.name as string);
                    return workspaceIdList;
                }, [])
                .includes(kanbanData.workspaceName)
        ) {
            log.error(`[DataKanbanManager] create -> could not find workspaceName`);
            return undefined;
        }

        if (
            !this.setKanbanInfo(kanbanUUID, {
                uuid: kanbanUUID,
                columns: ["backlog", "todo", "in progress", "Done"],
                totalIssue: 0,
                doneIssue: 0,
                nextIssue: 0,
                ...kanbanData,
            })
        ) {
            log.error(`[DataKanbanManager] create -> fail to setKanbanInfo`);
            return undefined;
        }
        setJsonData(`${this.getKanbanPath(kanbanUUID)}/issueList.json`, {});
        log.info(`kanbandata created: ${kanbanUUID}`);
        DataAlarmManager.create(userId, {
            type: "kanban",
            location: "",
            content: `${userId} create ${kanbanData.title} kanban at ${kanbanData.workspaceName}`,
            checkAlarm: (DataWorkspaceManager.getWorkspaceInfo(DataWorkspaceManager.getWorkspaceId(userId, kanbanData.workspaceName) as string)?.participants as string[]).reduce(
                (list: { [ket in string]: boolean }, member) => {
                    list[member] = true;
                    return list;
                },
                {}
            ),
        });
        return kanbanUUID;
    }

    static update(kanbanUUID: string, kanbanData: Partial<TkanbanData>, userId: string = "") {
        if (!isExists(this.getKanbanPath(kanbanUUID))) {
            log.error(`[DataKanbanManager] update -> could not find kanbanPath`);
            return false;
        }
        if (
            !this.setKanbanInfo(kanbanUUID, {
                ...this.getKanbanInfo(kanbanUUID),
                ...kanbanData,
            } as TkanbanData)
        ) {
            log.error(`[DataKanbanManager] update -> could not setKanbanInfo`);
            return false;
        }
        log.info(
            `kanbandata updated: ${JSON.stringify({
                ...this.getKanbanInfo(kanbanUUID),
                ...kanbanData,
            })}`
        );
        if (userId !== "") {
            DataAlarmManager.create(userId, {
                type: "kanban",
                location: "",
                content: `${userId} update ${kanbanData.title ?? this.getKanbanInfo(kanbanUUID)?.title} kanban at ${kanbanData.workspaceName}`,
                checkAlarm: (
                    DataWorkspaceManager.getWorkspaceInfo(DataWorkspaceManager.getWorkspaceId(userId, kanbanData.workspaceName ?? (this.getKanbanInfo(kanbanUUID)?.workspaceName as string)) as string)
                        ?.participants as string[]
                ).reduce((list: { [ket in string]: boolean }, member) => {
                    list[member] = true;
                    return list;
                }, {}),
            });
        }
        return true;
    }

    static delete(userId: string, kanbanUUID: string) {
        if (kanbanUUID === undefined || !fs.readdirSync(this.getKanbanPath()).includes(kanbanUUID)) {
            log.error(`[DataKanbanManager] delete -> kanban uuid is not in kanbanList`);
            return false;
        }
        const kanbanData = this.getKanbanInfo(kanbanUUID) as TkanbanData;
        fs.rmdirSync(this.getKanbanPath(kanbanUUID), { recursive: true });
        log.info(`kanbandata deleted: kanbanUUID: ${kanbanUUID}`);
        DataAlarmManager.create(userId, {
            type: "kanban",
            location: "",
            content: `${userId} delete ${kanbanData.title} kanban at ${kanbanData.workspaceName}`,
            checkAlarm: (DataWorkspaceManager.getWorkspaceInfo(DataWorkspaceManager.getWorkspaceId(userId, kanbanData.workspaceName) as string)?.participants as string[]).reduce(
                (list: { [ket in string]: boolean }, member) => {
                    list[member] = true;
                    return list;
                },
                {}
            ),
        });
        return true;
    }
}
