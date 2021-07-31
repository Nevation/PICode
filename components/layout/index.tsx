/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { LayoutStyle } from "../../styles/layout/layout";
import { Topbar } from "./topbar";
import { Sidebar } from "./sidebar";
import Messenger from "../service/chat/messenger";
import { throttle } from "lodash";
import UserMouse from "./usermouse";

interface IUserMouse {
  x: number,
  y: number
}

export interface ISocket {
  workingPath: string;
  userMouse?: IUserMouse;
}

export function Layout(ctx: any) {
  const classes = LayoutStyle();
  let ws = React.useRef<WebSocket | null>(null);
  const [userMouse, setUserMouse] = React.useState<IUserMouse>()
  const [loginUser, setLoginUser] = React.useState<{ [key: string]: ISocket }>()


  const getLoginUserData = () => {
    ws.current = new WebSocket(`ws://localhost:8000/?userId=${ctx.session.userId}`)
    ws.current.onopen = () => {
      if (ws.current!.readyState === WebSocket.OPEN) {
        ws.current!.send(JSON.stringify({ category: "connect" }))
        ws.current!.send(JSON.stringify({
          category: "work", type: "getWorkingPath", data: {
            workingPath: ctx.path
          }
        }))
      }
    }

    ws.current.onmessage = (msg: any) => {
      let loginUserData = JSON.parse(msg.data)
      setLoginUser(loginUserData.data)
    }
  }

  React.useEffect(() => {
    getLoginUserData();
  }, [])

  React.useEffect(() => {
    if (ws.current === null) return;
    if (ws.current!.readyState === WebSocket.OPEN) {
      let payload: ISocket = {
        workingPath: ctx.path
      }
      ws.current!.send(JSON.stringify({
        category: "work", type: "getWorkingPath", data: payload
      }))
    }
  }, [ctx.path])

  const userMouseMoveCapture = React.useCallback(throttle((e) => {
    if (ctx.path === "/code" || ctx.path === "/note") {
      setUserMouse({
        x: e.clientX,
        y: e.clientY
      })
    }
  }, 300), [])

  React.useEffect(() => {
    if (userMouse === null) return;
    if (ws.current === null) return;
    if (ws.current!.readyState === WebSocket.OPEN) {
      let payload: ISocket = {
        workingPath: ctx.path
      }
      if (ctx.path === "/code" || ctx.path === "/note") {
        payload.userMouse = userMouse
      }
      ws.current!.send(JSON.stringify({
        category: "work", type: "getWorkingPath", data: payload
      }))
    }
  }, [userMouse])

  return (
    <div className={classes.main} onMouseMoveCapture={userMouseMoveCapture}>
      <Topbar {...ctx} loginUser={loginUser} />
      <div className={classes.contentWrapper}>
        <Sidebar {...ctx} />
        {ctx.children}
      </div>
      <UserMouse loginUser={loginUser as any} />
      <Messenger />
    </div>
  );
}
