import { setupPopup } from "./js/popupcontainer.js";
import * as PeerConnection from "./js/peer.js";
import { saveNewFile } from "./main.js"

setupPopup("#peerConnections", "#peerContainer");


/**
 * @type {import("indexeddb-fs").CreateFsOutput}
 */
const fs = window["indexeddb-fs"].createFs();
const creatTeacherLink = document.querySelector("#creatTeacherLink");
const connectToTeacher = document.querySelector("#connectToTeacher");


// setting up events

creatTeacherLink.addEventListener("click", () => {
    PeerConnection.createTeacherLink();
    PeerConnection.settingBroadcastSystem({
        data: () => {
            return window["BMeditor"].getCode();
        }
    });
    const broadCastCallback = () => {
        PeerConnection.broadCastTeacherInfo();
    }
    window["BMeditor"].addChangeListener(broadCastCallback);
    const stopBroadCastButton = document.createElement("button");
    const statusContainer = document.createElement("div");
    statusContainer.appendChild(stopBroadCastButton);
    stopBroadCastButton.textContent = "教師廣播中（點此停止廣播)";
    stopBroadCastButton.addEventListener("click", () => {
        window["BMeditor"].removeChangeListener(broadCastCallback);
        PeerConnection.settingBroadcastSystem({
            isTeacher: false,
            data: () => ''
        });
        connectToTeacher.removeAttribute("disabled");
        statusContainer.remove();
    });
    ["button", "button-large", "button-warning"].forEach((className) => {
        stopBroadCastButton.classList.add(className);
    });
    statusContainer.style.display = "block";
    statusContainer.style.zIndex = 1000;
    statusContainer.style.position = "fixed";
    statusContainer.style.top = "0";
    statusContainer.style.right = "35%";
    document.body.appendChild(statusContainer);
    connectToTeacher.setAttribute("disabled", true);
});

connectToTeacher.addEventListener("click", () => {
    const urlParams = new URLSearchParams(window.location.search);
    let peerId = urlParams.get('peer');
    if (peerId === null) {
        peerId = window.prompt("請輸入老師分享的連線ID");
    }
    if (!peerId.match("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")){
        PeerConnection.createDialog("ID格式錯誤，請輸入正確的連線ID");
        return;
    }
    let studentName = window.prompt("請輸入你的名稱：");
    if (studentName === null || studentName.trim().length === 0) {
        studentName = "匿名學生" + new Date().getTime();
    }
    const connectingDialog = PeerConnection.createDialog(`連線建立中，請稍候...`, true);
    saveNewFile("FromTeacher.py");
    PeerConnection.settingBroadcastSystem({
        studentName: studentName,
        receiver: (code) => {
            window["BMeditor"].setCode(code);
        },
        reconnecting: true
    });
    PeerConnection.connectToTeacher(peerId);

    const disconnectButton = document.createElement("button");
    const statusContainer = document.createElement("div");
    statusContainer.appendChild(disconnectButton);
    disconnectButton.textContent = "與老師連線中（點此斷開連線)";
    disconnectButton.addEventListener("click", () => {
        disconnect();
        disconnectButton.remove();
    });
    ["button", "button-large", "button-warning"].forEach((className) => {
        disconnectButton.classList.add(className);
    });
    statusContainer.style.zIndex = 1000;
    statusContainer.style.position = "fixed";
    statusContainer.style.top = "0";
    statusContainer.style.right = "35%";
    statusContainer.style.display = "none";
    document.body.appendChild(statusContainer);

    const checkers = {
        timeoutChecker: null,
        connectedChecker: null,
    }
    checkers.timeoutChecker = setTimeout(() => {
        clearInterval(checkers.connectedChecker);
        disconnect();
        statusContainer.remove();
        connectingDialog.remove();
        PeerConnection.createDialog("連線逾時，請檢查網路狀況或重新嘗試");
    }, 10000);
    checkers.connectedChecker = setInterval(() => {
        if (PeerConnection.errorInfos.message === "無法連接到老師的主機！網路錯誤！") {
            clearInterval(checkers.timeoutChecker);
            disconnect();
            connectingDialog.remove();
            PeerConnection.createDialog("無法連接到老師的主機！網路錯誤！");
            PeerConnection.errorInfos.message = null;
        }
        if (PeerConnection.connectionToTeacher.conn !== null) {
            statusContainer.style.display = "block";
            clearTimeout(checkers.timeoutChecker);
            connectToTeacher.setAttribute("disabled", true);
            creatTeacherLink.setAttribute("disabled", true);
            connectingDialog.remove();
        } else {
            statusContainer.style.display = "none";
        }
    }, 500);

    function disconnect() {
        clearInterval(checkers.connectedChecker);
        PeerConnection.settingBroadcastSystem({
            isTeacher: false,
            receiver: console.log,
            reconnecting: false
        });
        PeerConnection.connectionToTeacher.conn?.close();
        connectToTeacher.removeAttribute("disabled");
        creatTeacherLink.removeAttribute("disabled");
    }
});
