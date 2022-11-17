/**
 * @type {import('peerjs').Peer}
 */
const selfPeer = new Peer({
    host: 'killkli.ddns.net',
    key: "killkliAPI",
    secure: true,
    port: 9000,
});
export const studentConns = [];
export const connectionToTeacher = { conn: null }
export const errorInfos = {
    message: null
}
const settings = {
    dataDom: "#messageCode",
    data: () => {
        return document.querySelector(settings.dataDom).value;
    },
    recevierDom: "#messageCode",
    receiver: (code) => {
        const receiverDom = document.querySelector(settings.recevierDom);
        receiverDom.value = code;
    },
    studentName: "student",
    isTeacher: false,
    reconnecting: true,
}
export function isTeacher() {
    return settings.isTeacher === true;
}

selfPeer.on("close", () => {
    console.log("connection closed");
    console.log("attempting to reconnect");
    try {
        selfPeer.reconnect();
    } catch (error) {
        console.log("無法重新登入，原因：", error);
        errorInfos.message = "無法重新登入，網路錯誤！";
        selfPeer.removeAllListeners("close");
    }
});

selfPeer.on("connection", (conn) => {
    studentConns.push(conn);
    conn.on("data", (data) => {
        console.log('Teacher server received:', data);
    });
    conn.on("close", () => {
        console.log("connection closed");
        studentConns.splice(studentConns.indexOf(conn), 1);
    });
});

export function createTeacherLink(callTimes = 0) {
    if (selfPeer.id === undefined || selfPeer.id === null) {
        selfPeer.reconnect();
        if (callTimes > 10) {
            console.log("failed to create teacher link");
            errorInfos.message = "無法建立連結，請檢查網路連線！";
            createDialog("無法建立連結，請檢查網路連線！");
            return;
        }
        console.log("waiting for peer id");
        setTimeout(() => createTeacherLink(callTimes + 1), 1000);
        return;
    }
    const teacherLink = `${window.location.origin}/?peer=${selfPeer.id}`;
    // document.body.focus();
    // window.navigator.clipboard.writeText(teacherLink);
    createDialog(`
    分享連結為：
    ${teacherLink}
    連結ID：
    ${selfPeer.id}
    請複製連結並傳送給學生！
    `);
    settings.isTeacher = true;
}

export function broadCastTeacherInfo() {
    const messageCode = settings.data();
    const message = {
        type: "teacherInfo",
        code: messageCode,
    };
    studentConns.forEach((conn) => {
        conn.send(message);
    });
}

export function settingBroadcastSystem(userSettings = settings) {
    Object.assign(settings, userSettings);
}

export function connectToTeacher(customID = undefined) {
    const urlParams = new URLSearchParams(window.location.search);
    const peerId = customID ?? urlParams.get('peer');
    if (peerId) {
        selfPeer.removeAllListeners("open");
        settings.isTeacher = false;
        if (!selfPeer.disconnected) {
            makeConnectionToTeacher(peerId);
        } else {
            selfPeer.reconnect();
            selfPeer.on("open", () => {
                makeConnectionToTeacher(peerId);
            });
        }
    } else {
        console.log("No peer id provided");
    }
}

function makeConnectionToTeacher(peerId) {
    const conn = selfPeer.connect(peerId, { metadata: { name: settings.studentName } });
    conn.on('open', () => {
        // Receive messages
        console.log("connected to teacher");
        connectionToTeacher.conn = conn;
        conn.on('data', data => {
            console.log('Student Client Received', data);
            if (data.type === "teacherInfo") {
                settings.receiver(data.code)
            }
        });
        // Send messages
        conn.send('Hello!');
        createDialog("已連接到老師的主機！");
    });
    conn.on("error", (err) => {
        console.log("error: ", err);
        connectionToTeacher.conn = null;
        settings.reconnecting = false;
        errorInfos.message = "無法連接到老師的主機！網路錯誤！";
        createDialog("無法連接到老師的主機！");
    });
    conn.on("close", () => {
        console.log("connection closed");
        connectionToTeacher.conn = null;
        if (settings.reconnecting) {
            console.log("attempting to reconnect");
            makeConnectionToTeacher();
            return;
        }
        createDialog("與老師的連線已斷開，請重新連結！");
    });
}



export function createDialog(message, noclosebutton = false) {
    const dialog = document.createElement("dialog");
    const dialogBody = document.createElement("div");
    dialog.appendChild(dialogBody);
    const dialogTextContainer = document.createElement("div");
    dialogTextContainer.classList.add("resultScreen-body");
    const dialogText = document.createElement("pre");
    dialogTextContainer.appendChild(dialogText);
    const disMissButton = document.createElement("button");
    dialogText.innerText = message;
    disMissButton.innerText = "關閉此視窗";
    ["button", "button-large", "button-primary"].forEach((className) => {
        disMissButton.classList.add(className);
    });
    disMissButton.onclick = () => {
        dialog.close();
        //remove dialog
        dialog.remove();
    };
    dialogBody.appendChild(dialogTextContainer);
    noclosebutton ? null : dialogBody.appendChild(disMissButton);
    dialogBody.style.justifyContent = "space-between";
    dialogBody.style.justifyItems = "stretch";
    document.body.appendChild(dialog);
    dialog.classList.add("resultScreenDialog");
    dialogBody.classList.add("resultScreen");
    dialog.style.height = "500px";
    dialog.showModal();
    return dialog;
}