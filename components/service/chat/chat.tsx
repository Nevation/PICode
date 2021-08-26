import React, { useEffect, useRef, useState } from "react";
import {
  chatStyle,
  createChannelStyle,
} from "../../../styles/service/chat/chat";
import {
  RadioButtonUnchecked,
  ArrowDropDown,
  FiberManualRecord,
  Close,
  Search,
  Add,
  Cancel,
  Clear,
  FormatBold,
  FormatItalic,
  FormatStrikethrough,
  Code,
  FormatListNumbered,
  Link,
  FormatListBulleted,
  AttachFile,
  SentimentSatisfiedOutlined,
  AlternateEmail,
  TextFormatOutlined,
  Send,
} from "@material-ui/icons";
import CustomButton from "../../items/input/button";

interface IChat {
  user: string;
  time: string;
  message: string;
  chatId: string;
  threadList: IChat[];
}

interface IDayBoundary {
  text: string;
}

interface IChannel {
  chatName: string;
  chatParticipant: string[];
  creation: string;
  description: string;
}

interface IThread {
  parentUser: string;
  parentMessage: string;
  chatName: string;
  messages: IChat[];
  parentId: string;
  parentTime: string;
}

type TUser = {
  [key in string]: boolean;
};

function CreateChannel({
  modal,
  userId,
  setModal,
  createChannel,
}: {
  modal: boolean;
  userId: string;
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
  createChannel: (
    chatName: string,
    description?: string,
    participant?: string[]
  ) => void;
}) {
  const classes = createChannelStyle();
  const [name, setName] = useState<string>("");
  const nameRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState<string>("");
  const [users, setUsers] = useState<TUser>({});
  const descriptionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userList = ["1", "2", "3"].reduce((a: TUser, c: string) => {
      if (c === userId) return a;
      return { ...a, [c]: false };
    }, {});

    // setUsers(userList)
  }, []);

  return (
    <React.Fragment>
      <div
        className={`${classes.overlay} ${!modal && classes.visibility}`}
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          event.preventDefault();

          setModal(false);
        }}
      ></div>
      <div className={`${classes.modal} ${!modal && classes.visibility}`}>
        <div className={classes.modalHeader}>
          <span>Create Channel</span>
          <div
            onClick={(event: React.MouseEvent<HTMLElement>) => {
              setModal(false);
            }}
          >
            <Close />
          </div>
        </div>
        <div className={classes.modalBody}>
          <input
            type="text"
            placeholder="Channel Name"
            ref={nameRef}
            value={name}
            className={classes.input}
            onChange={(event: any) => {
              setName(event.currentTarget.value);
            }}
          />
          <input
            type="text"
            placeholder="Description"
            ref={descriptionRef}
            value={description}
            className={classes.input}
            onChange={(event: any) => {
              setDescription(event.currentTarget.value);
            }}
          />
          <div className={classes.participantWrapper}>
            {Object.keys(users).map((v, i) => (
              <div className={classes.participant} key={`checkbox-${i}`}>
                <input
                  type="checkbox"
                  name={v}
                  id={v}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setUsers({
                      ...users,
                      [event.target.name]: event.target.checked,
                    });
                  }}
                />
                <label htmlFor={v}>{v}</label>
              </div>
            ))}
          </div>
        </div>
        <div className={classes.modalFooter}>
          <CustomButton
            text="CREATE"
            width="76px"
            onClick={() => {
              const participant = Object.keys(users).filter((v) => users[v]);

              createChannel(`#${name}`, description, participant);
              setName("");
              setDescription("");
              setModal(false);
            }}
          />
        </div>
      </div>
    </React.Fragment>
  );
}

export default function Chat(ctx: any) {
  const classes = chatStyle();
  const [messages, setMessages] = useState<IChat[]>([]);
  const [modal, setModal] = useState<boolean>(false);
  const [typing, setTyping] = useState<string[]>([]);
  const [target, setTarget] = useState<string>("");
  const [channelList, setChannelList] = useState<IChannel[]>([]);
  const [newMessage, setNewMessage] = useState<boolean>(false);
  const [thread, setThread] = useState<IThread | undefined>(undefined);
  const messageRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  function enterEvent(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (
        messageRef.current &&
        target !== "" &&
        messageRef.current.value !== ""
      ) {
        sendMessage(target, messageRef.current.value);
        messageRef.current.value = "";
        endRef.current!.scrollIntoView();
      }
    }
  }

  function handleResize() {
    if (document.getElementsByClassName(classes.newMessage).length > 0) {
      (
        document.getElementsByClassName(classes.newMessage)[0] as HTMLElement
      ).style.top = `${(Number(messageRef.current?.offsetTop) ?? 0) - 44}px`;
    }
  }

  function sendMessage(target: string, msg: string) {
    if (ctx.ws.current) {
      ctx.ws.current.send(
        JSON.stringify({
          category: "chat",
          type: "sendMessage",
          data: {
            target: target,
            msg: msg,
          },
        })
      );
    }
  }

  function getChat() {
    if (ctx.ws.current) {
      ctx.ws.current.send(
        JSON.stringify({
          category: "chat",
          type: "getChat",
        })
      );
    }
  }

  function getChatLog(target: string, page: string) {
    if (ctx.ws.current) {
      ctx.ws.current.send(
        JSON.stringify({
          category: "chat",
          type: "getChatLog",
          data: {
            target: target,
            page: page,
          },
        })
      );
    }
  }

  function getChatLogList(target: string) {
    if (ctx.ws.current) {
      ctx.ws.current.send(
        JSON.stringify({
          category: "chat",
          type: "getChatLogList",
          data: {
            target: target,
          },
        })
      );
    }
  }

  function createChannel(
    chatName: string,
    description?: string,
    participant?: string[]
  ) {
    if (ctx.ws.current) {
      ctx.ws.current.send(
        JSON.stringify({
          category: "chat",
          type: "createChannel",
          data: {
            target: chatName,
            description: description,
            chatParticipant: [ctx.session.userId, ...(participant ?? [])],
          },
        })
      );
    }
  }

  function DayBoundary({ text }: IDayBoundary) {
    const classes = chatStyle();

    return (
      <div className={classes.timeWrapper}>
        <div className={classes.dayBoundary}></div>
        <div className={classes.timeTicket}>{text}</div>
      </div>
    );
  }

  function MessageBox({ user, message, time, chatId, threadList }: IChat) {
    const classes = chatStyle();
    const timeValue = time.split(" ")[1].split(":");
    const meridiem = Number(timeValue[0]) > 11 ? "PM" : "AM";
    const hour = (() => {
      const convertedHour = Number(timeValue[0]);

      if (convertedHour % 12 === 0) {
        return "12";
      }

      if (convertedHour < 12) {
        return timeValue[0];
      } else {
        if (convertedHour % 12 < 10) {
          return `0${convertedHour % 12}`;
        }

        return `${convertedHour % 12}`;
      }
    })();
    const timeText = `${meridiem} ${hour}:${timeValue[1]} `;

    return (
      <div className={classes.messageBox}>
        <div className={classes.thumbnail}></div>
        <div>
          <div className={classes.target}>{user}</div>
          <div className={classes.textWrapper}>
            <span className={classes.messageText}>{message}</span>
            <span className={classes.time}>{timeText}</span>
          </div>
          {threadList.length > 0 && (
            <Thread
              parentUser={user}
              parentMessage={message}
              parentId={chatId}
              particiapnts={[]}
              messages={threadList}
              lastTime={threadList.slice(-1)[0].time}
              parentTime={time}
            />
          )}
        </div>
      </div>
    );
  }

  function MessageReverseBox({
    message,
    time,
    chatId,
    threadList,
    user,
  }: IChat) {
    const classes = chatStyle();
    const timeValue = time.split(" ")[1].split(":");
    const meridiem = Number(timeValue[0]) > 11 ? "PM" : "AM";
    const hour = (() => {
      const convertedHour = Number(timeValue[0]);

      if (convertedHour % 12 === 0) {
        return "12";
      }

      if (convertedHour < 12) {
        return timeValue[0];
      } else {
        if (convertedHour % 12 < 10) {
          return `0${convertedHour % 12}`;
        }

        return `${convertedHour % 12}`;
      }
    })();
    const timeText = `${meridiem} ${hour}:${timeValue[1]} `;

    return (
      <div
        className={classes.messageBox}
        style={{ display: "flex", justifyContent: "flex-end" }}
      >
        <div
          className={classes.textWrapper}
          style={{ display: "flex", flexDirection: "row-reverse" }}
        >
          <div className={classes.messageText}>{message}</div>
          <span className={classes.time}>{timeText}</span>
        </div>
        {threadList.length > 0 && (
          <Thread
            parentUser={user}
            parentMessage={message}
            parentId={chatId}
            particiapnts={[]}
            messages={threadList}
            lastTime={threadList.slice(-1)[0].time}
            parentTime={time}
          />
        )}
      </div>
    );
  }

  function Thread({
    parentId,
    particiapnts,
    messages,
    lastTime,
    parentUser,
    parentMessage,
    parentTime,
  }: {
    parentId: string;
    particiapnts: string[];
    messages: IChat[];
    lastTime: string;
    parentUser: string;
    parentMessage: string;
    parentTime: string;
  }) {
    const classes = chatStyle();

    return (
      <div
        className={classes.thread}
        onClick={() => {
          setThread({
            parentUser: parentUser,
            parentMessage: parentMessage,
            parentTime: parentTime,
            chatName: target,
            parentId: parentId,
            messages: messages,
          });
        }}
      >
        <div className={classes.threadParticipant}>
          {particiapnts.map((v, i) => {
            <div key={`${parentId}-thread-${i}`}></div>;
          })}
        </div>
        <div className={classes.threadCount}>{messages.length} replies</div>
        <div className={classes.lastThread}>Last reply 2 hours ago</div>
      </div>
    );
  }

  function renderMessage(messages: IChat[], classes: any, userId: string) {
    const value = [];

    for (let i = 0; i < messages.length; i++) {
      const dayCheck =
        i === 0 ||
        messages[i - 1].time.split(" ")[0] !== messages[i].time.split(" ")[0];

      if (dayCheck === true) {
        value.push(<DayBoundary text={messages[i].time.split(" ")[0]} />);
      }

      if (messages[i].user === userId) {
        value.push(
          <MessageReverseBox {...messages[i]} key={`messagebox-${i}`} />
        );
      } else {
        value.push(<MessageBox {...messages[i]} key={`messagebox-${i}`} />);
      }
    }

    return (
      <React.Fragment>
        {value.map((v, i) => (
          <React.Fragment key={`message-wrapper-${i}`}>{v}</React.Fragment>
        ))}
      </React.Fragment>
    );
  }

  useEffect(() => {
    setMessages([]);

    if (target !== "") {
      getChatLogList(target);
    }
  }, [target]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    document.addEventListener("keypress", enterEvent);
    return () => {
      document.removeEventListener("keypress", enterEvent);
    };
  }, [target]);

  useEffect(() => {
    if (ctx.ws === null) return;

    if (ctx.ws.current) {
      if (channelList.length === 0) getChat();

      ctx.ws.current.onmessage = (msg: any) => {
        const message = JSON.parse(msg.data);

        if (message.category === "chat") {
          switch (message.type) {
            case "createChannel":
              getChat();
              break;
            case "getChat":
              const channelList: IChannel[] = [];

              message.data.forEach((v: any) => {
                channelList.push(v);
              });

              setChannelList(channelList);
              break;

            case "getChatLog":
              const messageList: IChat[] = [];
              message.data.forEach((v: any) => {
                messageList.push({
                  user: v.sender,
                  message: v.message,
                  time: v.time,
                  chatId: v.chatId ?? "",
                  threadList: v.threadList ?? [],
                });
              });
              setMessages([...messages, ...messageList]);
              break;
            case "getChatLogList":
              message.data.forEach((v: string) => {
                getChatLog(target, v);
              });
              break;
            case "sendMessage":
              if (message.data.sender !== ctx.session.userId) {
                setNewMessage(true);
                setTimeout(() => {
                  setNewMessage(false);
                }, 3000);
              }

              setMessages([
                ...messages,
                {
                  user: message.data.sender,
                  message: message.data.message,
                  time: message.data.time,
                  chatId: message.data.chatId ?? "",
                  threadList: message.data.threadList ?? [],
                },
              ]);
              break;
          }
        }
      };
    }
  }, [ctx.ws.current, messages]);

  return (
    <div className={classes.root}>
      <div className={classes.sidebar}>
        <div className={classes.sidebarHeader}>
          <div className={classes.search}>
            <Search />
            <input type="text" placeholder="Search User or Channel" />
          </div>
        </div>
        <div className={classes.sidebarContent}>
          {channelList.map((v, i) => {
            return (
              <div
                className={classes.channel}
                key={`channel-${i}`}
                onClick={() => {
                  setTarget(v.chatName);
                }}
              >
                <div className={classes.channelThumbnail}></div>
                <div className={classes.channelBody}>
                  <div className={classes.channelInfo}>
                    <span className={classes.channelName}>{v.chatName}</span>
                    <span className={classes.channelParticipant}>
                      {v.chatName.includes("#") &&
                        `(${v.chatParticipant.join(", ")})`}
                    </span>
                  </div>
                  <div className={classes.lastContent}>
                    last message bla bla...
                  </div>
                </div>
                <div className={classes.channelTail}>
                  <div className={classes.unreadMessage}></div>
                  <div className={classes.lastTime}>44 minutes</div>
                </div>
              </div>
            );
          })}
          <div
            className={classes.createChannel}
            onClick={() => {
              setModal(true);
            }}
          >
            <Add />
          </div>
        </div>
      </div>
      {target !== "" ? (
        <div className={classes.contentWrapper}>
          <div className={classes.contentHeader}>
            <div className={classes.targetThubnail}></div>
            <div className={classes.targetInfo}>
              <div className={classes.targetName}>{target}</div>
              <div className={classes.targetLast}>44 minutes later</div>
            </div>
            <div className={classes.targetParticipant}></div>
          </div>
          <div className={classes.content}>
            <div className={classes.contentBox}>
              {renderMessage(messages, classes, ctx.session.userId)}
              <div ref={endRef} />
            </div>
          </div>
          <div className={classes.input}>
            <div className={classes.inputBox}>
              <input type="text" ref={messageRef} />
              <div className={classes.interaction}>
                <div>
                  <FormatBold />
                  <FormatItalic />
                  <FormatStrikethrough style={{ marginRight: "1px" }} />
                  <Code style={{ marginRight: "4px" }} />
                  <Link style={{ marginRight: "1px" }} />
                  <FormatListNumbered style={{ marginRight: "4px" }} />
                  <FormatListBulleted />
                </div>
                <div>
                  <TextFormatOutlined style={{ marginRight: "1px" }} />
                  <AlternateEmail style={{ marginRight: "4px" }} />
                  <SentimentSatisfiedOutlined style={{ marginRight: "4px" }} />
                  <AttachFile style={{ marginRight: "4px" }} />
                  <Send />
                </div>
              </div>
            </div>
            {typing.length > 0 && (
              <div className={classes.entering}>
                <span className={classes.enterIcon}>
                  <FiberManualRecord />
                  <FiberManualRecord />
                  <FiberManualRecord />
                </span>
                <span className={classes.enterText}>
                  {`${typing.map((v) => `${v} `)}is typing...`}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={classes.emptyWrapper}>
          Select a channel and start the conversation.
        </div>
      )}
      {thread !== undefined && (
        <div className={classes.activitybar}>
          <div className={classes.activitybarHeader}>
            <span>
              <span className={classes.activitybarTitle}>Thread</span>
              <span className={classes.activitybarTarget}>#project</span>
            </span>
            <span
              className={classes.activitybarClose}
              onClick={() => {
                setThread(undefined);
              }}
            >
              <Clear />
            </span>
          </div>
          <div className={classes.activitybarContent}>
            <div className={classes.contentBox}>
              <MessageBox
                user={thread.parentUser}
                message={thread.parentMessage}
                time={thread.parentTime}
                threadList={[]}
                chatId=""
              />
              {thread.messages.length > 0 && (
                <DayBoundary text={`${thread.messages.length} replies`} />
              )}
              {renderMessage(thread.messages, classes, ctx.session.userId)}
              <div ref={endRef} />
            </div>
            <div className={classes.input}>
              <div className={classes.inputBox}>
                <input type="text" ref={messageRef} />
                <div className={classes.interaction}>
                  <div>
                    <FormatBold />
                    <FormatItalic />
                    <FormatStrikethrough style={{ marginRight: "1px" }} />
                    <Code style={{ marginRight: "4px" }} />
                    <Link style={{ marginRight: "1px" }} />
                    <FormatListNumbered style={{ marginRight: "4px" }} />
                    <FormatListBulleted />
                  </div>
                  <div>
                    <TextFormatOutlined style={{ marginRight: "1px" }} />
                    <AlternateEmail style={{ marginRight: "4px" }} />
                    <SentimentSatisfiedOutlined
                      style={{ marginRight: "4px" }}
                    />
                    <AttachFile style={{ marginRight: "4px" }} />
                    <Send />
                  </div>
                </div>
              </div>

              {typing.length > 0 && (
                <div className={classes.entering}>
                  <span className={classes.enterIcon}>
                    <FiberManualRecord />
                    <FiberManualRecord />
                    <FiberManualRecord />
                  </span>
                  <span className={classes.enterText}>
                    {`${typing.map((v) => `${v} `)} is typing...`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <CreateChannel
        modal={modal}
        userId={ctx.session.userId}
        setModal={setModal}
        createChannel={createChannel}
      />
    </div>
  );
}
